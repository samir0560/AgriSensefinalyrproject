// Chatbot Controller
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const ChatExchange = require('../models/ChatExchange');

/** Models to try in order (first env override, then stable defaults). */
function getModelCandidates() {
    const fromEnv = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim();
    const defaults = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    if (fromEnv) return [fromEnv, ...defaults.filter((m) => m !== fromEnv)];
    return defaults;
}

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

/**
 * Build Gemini chat history from client context.
 * Expects { messages: [{ role: 'user'|'model', text }] } or legacy shapes.
 * History must start with a user message; consecutive same-role lines are merged.
 */
function normalizeChatHistory(context) {
    const raw = context && (context.messages || context.history);
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const normalized = [];
    for (const item of raw) {
        const isModel =
            item.role === 'model' ||
            item.role === 'assistant' ||
            item.sender === 'bot' ||
            item.sender === 'assistant';
        const role = isModel ? 'model' : 'user';
        const text = String(item.text || item.content || '').trim();
        if (!text) continue;
        normalized.push({ role, parts: [{ text }] });
    }

    while (normalized.length && normalized[0].role !== 'user') {
        normalized.shift();
    }

    const merged = [];
    for (const c of normalized) {
        const last = merged[merged.length - 1];
        if (last && last.role === c.role) {
            last.parts[0].text += `\n${c.parts[0].text}`;
        } else {
            merged.push({ role: c.role, parts: [{ text: c.parts[0].text }] });
        }
    }

    const maxMessages = 24;
    return merged.length > maxMessages ? merged.slice(-maxMessages) : merged;
}

function extractTextFromResult(result) {
    const response = result && result.response;
    if (!response) return '';

    try {
        const t = response.text();
        if (t && String(t).trim()) return String(t).trim();
    } catch {
        /* blocked or malformed — try candidates */
    }

    const candidates = response.candidates;
    if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        const txt = candidates[0].content.parts.map((p) => p.text || '').join('');
        if (txt.trim()) return txt.trim();
    }

    return '';
}

function buildSystemInstruction(targetLanguage) {
    return `You are **AgriSense Assistant**, the in-app farming advisor for the AgriSense agricultural decision-support platform.

**Your role**
- Answer questions about: crop choice and rotation, soil health and testing, irrigation and water management, organic and synthetic fertilizers and nutrient plans, pests, diseases, and integrated management, weather-sensitive decisions (without claiming live data), post-harvest handling, farm economics at a basic level, sustainable and precision agriculture, and related tools in AgriSense (crop prediction, fertilizer, disease, irrigation, weather, soil analysis).

**Conversation**
- Use prior messages in this chat. Resolve pronouns and short follow-ups (e.g. "what about organic?", "any cheaper option?") from earlier turns.
- If the question is unclear, ask **one** short clarifying question, then still give useful general guidance.
- If the user writes in a mix of languages, respond only in ${targetLanguage}.

**Style**
- Be direct, practical, and respectful toward smallholder and commercial farmers.
- Prefer short paragraphs and bullet points for steps or lists.
- When mentioning pesticides or chemicals, add a brief safety note (label, PPE, local regulations).
- Do not invent real-time weather or market prices; suggest checking forecasts or local extension services when relevant.
- If asked something unrelated to farming, answer very briefly if appropriate, then steer back to how you can help with agriculture.

**Output language**
- Respond **only** in ${targetLanguage}.`;
}

// @desc    Get chatbot response to user message
// @route   POST /api/chatbot/message
// @access  Public (optional Bearer token saves exchange for logged-in users)
const getChatResponse = async (req, res) => {
    try {
        const { message, userId, context, locale } = req.body;

        // Validate required fields
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Process the user message and generate response using Gemini API
        const response = await generateChatResponse(message, context, locale);

        if (req.userId) {
            try {
                await ChatExchange.create({
                    user: req.userId,
                    userMessage: message,
                    botResponse: response,
                    locale: locale || 'en'
                });
            } catch (saveErr) {
                console.error('Failed to save chat exchange:', saveErr);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                response: response,
                timestamp: new Date().toISOString(),
                userId: userId || req.userId || null
            }
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during chatbot processing',
            error: error.message
        });
    }
};

// @desc    List saved chat exchanges for current user
// @route   GET /api/chatbot/history
// @access  Private
const getChatHistory = async (req, res) => {
    try {
        const exchanges = await ChatExchange.find({ user: req.userId })
            .sort({ createdAt: 1 })
            .limit(500)
            .lean();

        res.status(200).json({
            success: true,
            data: exchanges
        });
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while loading chat history'
        });
    }
};

async function generateWithGeminiModel(genAI, modelName, history, userMessage, targetLanguage) {
    const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemInstruction(targetLanguage),
        safetySettings: SAFETY_SETTINGS,
        generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40
        }
    });

    const chat = model.startChat({ history });

    const result = await chat.sendMessage(userMessage);
    return extractTextFromResult(result);
}

// Function to generate chatbot response based on user input
async function generateChatResponse(userMessage, context = {}, locale = 'en') {
    const trimmed = String(userMessage || '').trim();
    if (!trimmed) {
        return getRuleBasedResponse('hello', locale);
    }

    if (!process.env.GEMINI_API_KEY) {
        return getRuleBasedResponse(trimmed, locale);
    }

    const localeLanguageMap = {
        en: 'English',
        es: 'Spanish',
        hi: 'Hindi',
        ne: 'Nepali',
        te: 'Telugu'
    };
    const targetLanguage = localeLanguageMap[locale] || localeLanguageMap.en;

    const history = normalizeChatHistory(context);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelNames = getModelCandidates();

    let lastError = null;

    for (const modelName of modelNames) {
        const maxAttempts = 3;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const text = await generateWithGeminiModel(genAI, modelName, history, trimmed, targetLanguage);
                if (text) {
                    return text;
                }
                console.warn(`Gemini empty text (${modelName}), retry ${attempt + 1}/${maxAttempts}`);
            } catch (error) {
                lastError = error;
                const errorMessage = String(error.message || '');
                console.error(`Gemini API Error [${modelName}] (Attempt ${attempt + 1}):`, errorMessage);

                if (error.status === 404 || /not found|not supported|invalid model|404/i.test(errorMessage)) {
                    break;
                }

                if (error.status === 429 || errorMessage.includes('429')) {
                    if (attempt < maxAttempts - 1) {
                        const waitTime = (attempt + 1) * 2000;
                        console.log(`Rate limit. Waiting ${waitTime / 1000}s...`);
                        await new Promise((resolve) => setTimeout(resolve, waitTime));
                        continue;
                    }
                    return getRuleBasedResponse(trimmed, locale);
                }

                if (/safety|blocked|SAFETY|blocked/i.test(errorMessage)) {
                    return getRuleBasedResponse(trimmed, locale);
                }

                break;
            }
        }
    }

    if (lastError) {
        console.error('Gemini: all models/attempts failed:', lastError.message);
    }
    return getRuleBasedResponse(trimmed, locale);
}

// Rule-based fallback responses
function getRuleBasedResponse(userMessage, locale = 'en') {
    const message = userMessage.toLowerCase();
    
    // Helper to pick language-specific text
    const L = (options) => {
        switch (locale) {
            case 'es': return options.es || options.en;
            case 'hi': return options.hi || options.en;
            case 'ne': return options.ne || options.en;
            case 'te': return options.te || options.en;
            default: return options.en;
        }
    };

    // Irrigation / water management
    if (
        message.includes('irrigation') ||
        message.includes('drip') ||
        message.includes('sprinkler') ||
        message.includes('watering') ||
        message.includes('water management') ||
        message.includes('सिंचाई') ||
        message.includes('నీటిపారుదల')
    ) {
        return L({
            en: 'Match irrigation to soil type, crop stage, and weather. Prefer measured water (soil moisture or ET-based scheduling) over fixed calendars. Drip saves water and reduces leaf wetness; flood or furrow suits some cereals. Avoid over-irrigation to limit disease and nutrient leaching.',
            es: 'Adapte el riego al tipo de suelo, fase del cultivo y clima. Prefiera programar según humedad del suelo o evapotranspiración. El goteo ahorra agua y reduce el mojado del follaje; surcos o inundación encajan en algunos cereales. Evite el exceso de riego para limitar enfermedades y lixiviación.',
            hi: 'सिंचाई को मिट्टी, फसल की अवस्था और मौसम के अनुसार मिलाएँ। निश्चित समय से बेहतर है मिट्टी की नमी या वाष्पोत्सर्जन के आधार पर निर्धारण। ड्रिप से पानी बचता है और पत्तियाँ कम भीगती हैं; कुछ अनाजों में नाली या बाढ़ सिंचाई उपयुक्त होती है। अधिक सिंचाई से रोग और पोषक लीचिंग बढ़ सकती है।',
            ne: 'सिँचाइ माटो, बालीको अवस्था र मौसम अनुसार मिलाउनुहोस्। निश्चित समयभन्दा माटोको आर्द्रता वा वाष्पोत्सर्जन आधारित तालिका राम्रो। ड्रिपले पानी बचाउँछ र पात कम भिजाउँछ; केही अन्नमा नाली वा बाढ सिँचाइ उपयुक्त। बढी सिँचाइले रोग र पोषक लिकेज बढाउन सक्छ।',
            te: 'నీటిపారుదలను నేల రకం, పంట దశ, వాతావరణానికి అనుగుణంగా ఉంచండి. స్థిత సమయాల కంటే నేల తేమ లేదా ఎవపోట్రాన్స్‌పిరేషన్ ఆధారంగా షెడ్యూల్ మేలు. డ్రిప్ నీటిని ఆదా చేస్తుంది మరియు ఆకుల తడి తగ్గిస్తుంది; కొన్ని ధాన్యాలకు ముండా/ప్రవాహ సేంద్రియం సరిపోవచ్చు. అధిక నీటిపారుదల వ్యాధులు, పోషక క్షయాన్ని పెంచవచ్చు.'
        });
    }

    // Crop-related queries
    if (
        message.includes('crop') ||
        message.includes('plant') ||
        message.includes('seed') ||
        message.includes('wheat') ||
        message.includes('rice') ||
        message.includes('maize') ||
        message.includes('tomato') ||
        message.includes('potato') ||
        message.includes('cotton')
    ) {
        return L({
            en: "For crop selection, consider factors like soil type, climate, water availability, and market demand. Popular crops include rice, wheat, corn, and pulses. Would you like specific advice for your region?",
            es: "Para la selección de cultivos, tenga en cuenta el tipo de suelo, el clima, la disponibilidad de agua y la demanda del mercado. Los cultivos populares incluyen arroz, trigo, maíz y legumbres. ¿Le gustaría un consejo específico para su región?",
            hi: "फसल चयन के लिए मिट्टी के प्रकार, जलवायु, पानी की उपलब्धता और बाजार की मांग जैसे कारकों को ध्यान में रखें। लोकप्रिय फसलों में धान, गेहूं, मक्का और दालें शामिल हैं। क्या आप अपने क्षेत्र के लिए विशेष सलाह चाहते हैं?",
            ne: "बाली चयन गर्दा माटोको प्रकार, मौसम, पानीको उपलब्धता र बजार माग जस्ता कुराहरू विचार गर्नुहोस्। प्रचलित बालीनालीमा धान, गहुँ, मकै र दालहरू पर्छन्। के तपाईं आफ्नो क्षेत्रका लागि विशिष्ट सल्लाह चाहनुहुन्छ?",
            te: "పంట ఎంపిక కోసం నేల రకం, వాతావరణం, నీటి లభ్యత మరియు మార్కెట్ డిమాండ్ వంటి అంశాలను పరిగణనలోకి తీసుకోండి. ప్రముఖ పంటల్లో బియ్యం, గోధుమ, మొక్కజొన్న మరియు పప్పులు ఉన్నాయి. మీ ప్రాంతానికి ప్రత్యేక సలహా కావాలా?"
        });
    }
    
    // Fertilizer-related queries
    if (message.includes('fertilizer') || message.includes('manure') || message.includes('nutrient')) {
        return L({
            en: "For fertilizers, consider using organic options like compost or vermicompost. For chemical fertilizers, NPK ratios should match your crop's needs. For example, use higher nitrogen for leafy crops and higher phosphorus for root crops.",
            es: "Para los fertilizantes, considere usar opciones orgánicas como compost o vermicompost. En el caso de fertilizantes químicos, la relación NPK debe ajustarse a las necesidades de su cultivo. Por ejemplo, use más nitrógeno para cultivos de hoja y más fósforo para cultivos de raíz.",
            hi: "उर्वरक के लिए कंपोस्ट या वर्मी-कंपोस्ट जैसे जैविक विकल्पों का उपयोग करने पर विचार करें। रासायनिक उर्वरकों में NPK अनुपात आपकी फसल की जरूरतों के अनुसार होना चाहिए। उदाहरण के लिए, पत्तेदार फसलों के लिए अधिक नाइट्रोजन और कंद वाली फसलों के लिए अधिक फॉस्फोरस दें।",
            ne: "मलको लागि कम्पोस्ट वा भर्मी-कम्पोस्ट जस्ता जैविक विकल्पहरू प्रयोग गर्ने बारे सोच्नुहोस्। रासायनिक मल प्रयोग गर्दा NPK को अनुपात तपाईंको बालीको आवश्यकता अनुसार मिलाउनुहोस्। उदाहरणका लागि, पातलो बालीका लागि बढी नाइट्रोजन र जरायुक्त बालीका लागि बढी फस्फोरस दिनुहोस्।",
            te: "ఎరువుల కోసం కంపోస్ట్ లేదా వర్మీ కంపోస్ట్ వంటి సేంద్రీయ ఎంపికలను ఉపయోగించడాన్ని పరిగణించండి. రసాయన ఎరువులలో NPK నిష్పత్తి మీ పంట అవసరాలకు సరిపోయేలా ఉండాలి. ఉదాహరణకు, ఆకుకూరల కోసం ఎక్కువ నైట్రోజన్, వేరుశనగల వంటి వేరుబంధ పంటల కోసం ఎక్కువ ఫాస్ఫరస్ ఇవ్వండి."
        });
    }
    
    // Disease-related queries
    if (message.includes('disease') || message.includes('pest') || message.includes('insect') || message.includes('sick')) {
        return L({
            en: "For plant diseases, ensure proper spacing for air circulation, rotate crops, and use disease-resistant varieties. For pests, consider integrated pest management with biological controls and targeted treatments.",
            es: "Para las enfermedades de las plantas, mantenga el distanciamiento adecuado para la circulación del aire, realice rotación de cultivos y utilice variedades resistentes a enfermedades. Para plagas, considere el manejo integrado con controles biológicos y tratamientos específicos.",
            hi: "पौधों के रोगों के लिए पौधों के बीच उचित दूरी रखें, फसल चक्र अपनाएँ और रोग प्रतिरोधी किस्मों का उपयोग करें। कीटों के लिए जैविक नियंत्रण और लक्षित दवाओं के साथ समन्वित कीट प्रबंधन अपनाएँ।",
            ne: "बिरुवाका रोगहरूका लागि हावाको आवतजावत हुने गरी उचित दूरी कायम गर्नुहोस्, बाली चक्र अपनाउनुहोस् र रोग प्रतिरोधी जात प्रयोग गर्नुहोस्। कीराहरूका लागि जैविक नियन्त्रण र लक्षित उपचार सहित एकीकृत कीरा व्यवस्थापन प्रयोग गर्नुहोस्।",
            te: "మొక్కల వ్యాధుల కోసం గాలి ప్రసరణకు తగినంత దూరం ఉంచండి, పంట మార్పిడి చేయండి మరియు వ్యాధి నిరోధక రకాలను ఉపయోగించండి. పురుగుల నియంత్రణకు జీవ నియంత్రణలు మరియు లక్ష్యిత మందులతో సమగ్ర కీటక నిర్వహణను అనుసరించండి."
        });
    }
    
    // Weather-related queries
    if (message.includes('weather') || message.includes('rain') || message.includes('temperature') || message.includes('season')) {
        return L({
            en: "For weather-related farming advice, monitor local forecasts and plan activities accordingly. Consider drought-resistant crops during dry periods and ensure proper drainage during heavy rains.",
            es: "Para el asesoramiento agrícola relacionado con el clima, revise los pronósticos locales y planifique sus actividades en consecuencia. Considere cultivos resistentes a la sequía en períodos secos y asegure un buen drenaje durante lluvias intensas.",
            hi: "मौसम से जुड़ी खेती सलाह के लिए स्थानीय मौसम पूर्वानुमान पर नज़र रखें और उसी के अनुसार गतिविधियाँ योजनाबद्ध करें। शुष्क अवधि में सूखा सहनशील फसलों पर विचार करें और भारी वर्षा के समय उचित निकास की व्यवस्था रखें।",
            ne: "मौसमसँग सम्बन्धित कृषी सल्लाहका लागि स्थानीय मौसम पूर्वानुमान हेर्नुहोस् र त्यही अनुसार गतिविधिहरू योजना बनाउनुहोस्। सुख्खा अवधिमा खडेरी सहनशील बाली प्रयोग गर्नुहोस् र बढी वर्षा हुँदा उचित निकासको व्यवस्था गर्नुहोस्।",
            te: "వాతావరణ సంబంధిత వ్యవసాయ సలహాల కోసం స్థానిక వాతావరణ సూచనలను గమనించి, వాటి ఆధారంగా మీ పనులను ప్రణాళిక చేయండి. ఎండాకాలంలో ఎండను తట్టుకునే పంటలను పరిగణించండి మరియు భారీ వర్షాల సమయంలో సరైన నీటి పారుదల ఉండేలా చూడండి."
        });
    }
    
    // Soil-related queries
    if (message.includes('soil') || message.includes('land') || message.includes('ground')) {
        return L({
            en: "For soil health, test pH levels and nutrient content. Add organic matter like compost to improve fertility. Maintain proper drainage and consider crop rotation to preserve soil nutrients.",
            es: "Para la salud del suelo, analice el nivel de pH y el contenido de nutrientes. Agregue materia orgánica como compost para mejorar la fertilidad. Mantenga un buen drenaje y considere la rotación de cultivos para preservar los nutrientes del suelo.",
            hi: "मिट्टी की सेहत के लिए pH स्तर और पोषक तत्वों की मात्रा की जाँच करें। उर्वरता बढ़ाने के लिए कंपोस्ट जैसी जैविक सामग्री मिलाएँ। उचित निकास बनाए रखें और मिट्टी के पोषक तत्वों को बचाने के लिए फसल चक्र अपनाएँ।",
            ne: "माटोको स्वास्थ्यका लागि pH स्तर र पोषक तत्वहरूको मात्रा परीक्षण गर्नुहोस्। उर्वराशक्ति बढाउन कम्पोस्ट जस्ता जैविक पदार्थ थप्नुहोस्। उचित निकास कायम राख्नुहोस् र माटोका पोषक तत्व जोगाउन बाली चक्र अपनाउनुहोस्।",
            te: "నేల ఆరోగ్యానికి pH స్థాయి మరియు పోషక పదార్థాల పరిమాణాన్ని పరీక్షించండి. సారాన్ని పెంచేందుకు కంపోస్ట్ వంటి సేంద్రీయ పదార్థాలను జోడించండి. సరైన నీటి పారుదల ఉండేలా చూసి, నేల పోషకాలను కాపాడడానికి పంట మార్పిడిని అనుసరించండి."
        });
    }
    
    // General farming queries
    if (message.includes('farm') || message.includes('cultivation') || message.includes('agriculture') || message.includes('farming')) {
        return L({
            en: "Successful farming involves proper planning, soil preparation, timely sowing, irrigation management, pest control, and harvest timing. Consider using modern techniques like precision farming for better yields.",
            es: "Una agricultura exitosa implica una buena planificación, preparación del suelo, siembra oportuna, manejo del riego, control de plagas y una cosecha en el momento adecuado. Considere técnicas modernas como la agricultura de precisión para obtener mejores rendimientos.",
            hi: "सफल खेती के लिए सही योजना, मिट्टी की तैयारी, समय पर बुआई, सिंचाई प्रबंधन, कीट नियंत्रण और उचित समय पर कटाई ज़रूरी है। बेहतर उत्पादन के लिए प्रिसिजन फार्मिंग जैसी आधुनिक तकनीकों पर विचार करें।",
            ne: "सफल खेतीका लागि राम्रो योजना, माटो तयारी, समयमा बिउ छर्ने, सिँचाइ व्यवस्थापन, कीरा नियन्त्रण र उचित समयमा भित्र्याउने कार्य आवश्यक हुन्छ। राम्रो उत्पादनका लागि प्रिसिजन फार्मिङ जस्ता आधुनिक प्रविधि प्रयोग गर्ने बारे सोच्नुहोस्।",
            te: "విజయవంతమైన వ్యవసాయానికి సరైన ప్రణాళిక, నేల సిద్ధం, సమయానికి విత్తనం విత్తడం, నీటిపారుదల నిర్వహణ, పురుగుల నియంత్రణ మరియు సరైన సమయంలో కోత అవసరం. మెరుగైన దిగుబడుల కోసం ప్రెసిషన్ ఫార్మింగ్ వంటి ఆధునిక సాంకేతికాలను పరిగణించండి."
        });
    }
    
    // Default response
    return L({
        en: "I'm here to help with your agricultural needs! I can provide information about crops, fertilizers, pest control, soil health, weather, and farming techniques. What specific farming topic would you like to know about?",
        es: "¡Estoy aquí para ayudarte con tus necesidades agrícolas! Puedo brindarte información sobre cultivos, fertilizantes, control de plagas, salud del suelo, clima y técnicas de cultivo. ¿Sobre qué tema agrícola específico te gustaría saber más?",
        hi: "मैं आपकी कृषि से जुड़ी ज़रूरतों में मदद करने के लिए यहाँ हूँ! मैं फसल, उर्वरक, कीट नियंत्रण, मिट्टी की सेहत, मौसम और खेती की तकनीकों के बारे में जानकारी दे सकता हूँ। आप किस खास विषय के बारे में जानना चाहते हैं?",
        ne: "म तपाईंका कृषि सम्बन्धी आवश्यकताहरूमा मद्दत गर्न यहाँ छु! म बाली, मल, कीरा नियन्त्रण, माटोको स्वास्थ्य, मौसम र खेतीका प्रविधिहरूबारे जानकारी दिन सक्छु। तपाईं कुन विशेष विषयबारे जान्न चाहनुहुन्छ?",
        te: "మీ వ్యవసాయ అవసరాలకు సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను! పంటలు, ఎరువులు, పురుగుల నియంత్రణ, నేల ఆరోగ్యం, వాతావరణం మరియు వ్యవసాయ పద్ధతుల గురించి నేను సమాచారం అందించగలను. మీరు ఏ ప్రత్యేక అంశం గురించి తెలుసుకోవాలనుకుంటున్నారు?"
    });
}

module.exports = {
    getChatResponse,
    getChatHistory
};