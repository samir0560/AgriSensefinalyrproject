// Disease Controller
const spawn = require('child_process').spawn;
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Multer configuration for image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// @desc    Predict disease from image
// @route   POST /api/disease/predict
// @access  Public
const predictDisease = async (req, res) => {
    try {
        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image file'
            });
        }

        // Path to the Python script
        const pythonScriptPath = path.join(__dirname, '../python/predict_disease.py');
        const imagePath = req.file.path;
        
        // Prepare arguments for the Python script
        const args = [
            pythonScriptPath,
            imagePath
        ];

        // Execute the Python script
        const process = spawn('python', args);

        let data = '';
        let errorData = '';

        process.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        process.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        process.on('close', (code) => {
            // Clean up uploaded file after processing
            fs.unlinkSync(imagePath);

            if (code !== 0) {
                console.error('Python script error:', errorData);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing disease prediction',
                    error: errorData
                });
            }

            try {
                const result = JSON.parse(data);
                res.status(200).json({
                    success: true,
                    data: result
                });
            } catch (parseError) {
                res.status(500).json({
                    success: false,
                    message: 'Error parsing Python script output',
                    error: parseError.message
                });
            }
        });

    } catch (error) {
        console.error('Disease prediction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during disease prediction',
            error: error.message
        });
    }
};

// @desc    Get all diseases
// @route   GET /api/disease
// @access  Public
const getAllDiseases = async (req, res) => {
    try {
        // In a real application, this would fetch from a database
        const diseases = [
            { id: 1, name: 'Rust', crop: 'Wheat', symptoms: 'Red/brown pustules on leaves', treatment: 'Fungicides' },
            { id: 2, name: 'Blight', crop: 'Tomato', symptoms: 'Dark spots on leaves', treatment: 'Remove affected parts' },
            { id: 3, name: 'Powdery Mildew', crop: 'Grapes', symptoms: 'White powdery coating on leaves', treatment: 'Sulfur-based fungicides' },
            { id: 4, name: 'Late Blight', crop: 'Potato', symptoms: 'Water-soaked lesions on leaves', treatment: 'Copper-based fungicides' }
        ];

        res.status(200).json({
            success: true,
            count: diseases.length,
            data: diseases
        });
    } catch (error) {
        console.error('Get all diseases error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching diseases',
            error: error.message
        });
    }
};

// @desc    Get disease by ID
// @route   GET /api/disease/:id
// @access  Public
const getDiseaseById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // In a real application, this would fetch from a database
        const diseases = {
            1: { 
                id: 1, 
                name: 'Rust', 
                crop: 'Wheat', 
                symptoms: 'Red/brown pustules on leaves', 
                treatment: 'Fungicides',
                prevention: 'Resistant varieties, proper spacing'
            },
            2: { 
                id: 2, 
                name: 'Blight', 
                crop: 'Tomato', 
                symptoms: 'Dark spots on leaves', 
                treatment: 'Remove affected parts',
                prevention: 'Proper watering, good air circulation'
            },
            3: { 
                id: 3, 
                name: 'Powdery Mildew', 
                crop: 'Grapes', 
                symptoms: 'White powdery coating on leaves', 
                treatment: 'Sulfur-based fungicides',
                prevention: 'Avoid overhead watering'
            },
            4: { 
                id: 4, 
                name: 'Late Blight', 
                crop: 'Potato', 
                symptoms: 'Water-soaked lesions on leaves', 
                treatment: 'Copper-based fungicides',
                prevention: 'Crop rotation, resistant varieties'
            }
        };

        const disease = diseases[id];
        
        if (!disease) {
            return res.status(404).json({
                success: false,
                message: 'Disease not found'
            });
        }

        res.status(200).json({
            success: true,
            data: disease
        });
    } catch (error) {
        console.error('Get disease by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during fetching disease',
            error: error.message
        });
    }
};

module.exports = {
    predictDisease,
    getAllDiseases,
    getDiseaseById,
    upload
};