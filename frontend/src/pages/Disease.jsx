import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';
import { logClientFeatureResult } from '../api/api';

const Disease = () => {
  const { t } = useI18n();
  const { token } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setApiError(null);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const showAlert = (message, isError = false) => {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      left: auto;
      background: ${isError ? '#f44336' : '#4caf50'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    alertDiv.textContent = message;
    
    if (!document.querySelector('#alert-styles')) {
      const style = document.createElement('style');
      style.id = 'alert-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      alertDiv.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        if (alertDiv.parentNode) alertDiv.parentNode.removeChild(alertDiv);
      }, 300);
    }, 3000);
  };

  // Improved plant detection with better prompting
  const checkIfPlant = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `You are an agricultural expert. Look at this image carefully. 
    Is there ANY plant, crop, tree, flower, vegetable, fruit, leaf, stem, root, or any part of a plant visible in this image?
    
    Respond with ONLY one word:
    - "YES" if you see ANY plant material (even if it's diseased, damaged, or just a leaf)
    - "NO" if there is absolutely NO plant material (people, animals, buildings, cars, soil without plants, rocks, sky, water, etc.)
    
    Be generous - if there's any green or plant-like structure, answer YES.
    Only answer NO if it's completely unrelated to plants.
    Your answer MUST be either YES or NO, nothing else.`;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
          }
        })
      });
      
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      console.log('Plant detection response:', answer);
      return answer === 'YES';
    } catch (error) {
      console.error('Error checking plant:', error);
      // If API fails, assume it's a plant to allow processing
      return true;
    }
  };

  // Detect plant disease with detailed information
  const detectPlantDisease = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `You are an expert plant pathologist. Analyze this plant image and provide a detailed disease diagnosis.
    
    Return ONLY valid JSON in this exact format (no other text):
    {
      "disease_name": "exact name of the disease or 'Healthy Plant'",
      "scientific_name": "scientific name of the pathogen if applicable",
      "disease_type": "Fungal/Bacterial/Viral/Nutrient Deficiency/Physical Damage/Healthy",
      "severity": "Mild/Moderate/Severe/None",
      "confidence": 85,
      "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
      "medicine_1": {
        "name": "first medicine/fungicide name",
        "type": "Chemical/Organic/Biological",
        "application": "how to apply",
        "dosage": "recommended dosage"
      },
      "medicine_2": {
        "name": "second medicine/alternative treatment",
        "type": "Chemical/Organic/Biological",
        "application": "how to apply",
        "dosage": "recommended dosage"
      },
      "prevention_tips": ["tip 1", "tip 2", "tip 3"],
      "description": "detailed description of the disease and its effects"
    }
    
    IMPORTANT RULES:
    - If the plant looks healthy, set disease_name to "Healthy Plant" and severity to "None"
    - Always provide 2 different medicines/treatments (chemical and organic options when possible)
    - Be specific and practical with medicine names
    - Confidence should reflect your certainty (0-100)
    - Return ONLY valid JSON, nothing else`;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image.split(',')[1]
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 1,
            topP: 1,
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('No response from Gemini API');
      }
      
      console.log('Raw API response:', textResponse);
      
      // Parse JSON from response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(textResponse);
      } catch (e) {
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid JSON response from API');
        }
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Disease detection error:', error);
      setApiError(`Gemini API Error: ${error.message}`);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      showAlert('Please select an image first', true);
      return;
    }
    
    setLoading(true);
    setError(null);
    setApiError(null);
    
    try {
      const base64Image = await fileToBase64(selectedImage);
      
      // Check if it's a plant with better tolerance
      showAlert('🔍 Analyzing image content...', false);
      const isPlant = await checkIfPlant(base64Image);
      
      if (!isPlant) {
        showAlert('⚠️ Could not detect clear plant material. Please upload a clearer image of a plant leaf or crop.', true);
        setLoading(false);
        return;
      }
      
      // Detect disease
      showAlert('🌱 Plant detected! Analyzing for diseases...', false);
      const diseaseResult = await detectPlantDisease(base64Image);
      
      setResult(diseaseResult);
      showAlert(`✅ Analysis complete! ${diseaseResult.disease_name === 'Healthy Plant' ? 'Your plant appears healthy! 🌿' : 'Disease identified. Check treatment below.'}`, false);
      
      if (token) {
        await logClientFeatureResult(token, {
          featureType: 'disease',
          request: { 
            imageFileName: selectedImage.name,
            timestamp: new Date().toISOString()
          },
          response: { success: true, data: diseaseResult }
        });
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to analyze image');
      showAlert(`❌ Error: ${err.message || 'Analysis failed. Please try again.'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNew = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setApiError(null);
    document.getElementById('image-input').click();
  };

  // Get color based on disease type
  const getDiseaseColor = (diseaseName, diseaseType) => {
    if (diseaseName === 'Healthy Plant') return '#4caf50';
    if (diseaseType === 'Fungal') return '#ff9800';
    if (diseaseType === 'Bacterial') return '#f44336';
    if (diseaseType === 'Viral') return '#9c27b0';
    if (diseaseType === 'Nutrient Deficiency') return '#2196f3';
    return '#e91e63';
  };

  return (
    <div className="disease-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="container">
        <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>🌿 AI Plant Disease Detection</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>
          Upload a clear photo of your plant for real-time disease diagnosis using Google Gemini AI
        </p>
        
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ 
            border: '2px dashed #ccc', 
            borderRadius: '12px', 
            padding: '32px',
            textAlign: 'center',
            backgroundColor: '#f9f9f9'
          }}>
            <input
              type="file"
              id="image-input"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="image-input" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📸</div>
              <div style={{ fontSize: '16px', color: '#4caf50', fontWeight: 'bold' }}>
                Click to Upload Image
              </div>
              <small style={{ color: '#999' }}>JPG, PNG, JPEG (Max 10MB)</small>
            </label>
          </div>
          
          {preview && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <img src={preview} alt="Preview" style={{ 
                maxWidth: '100%', 
                maxHeight: '200px', 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }} />
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading || !selectedImage}
            style={{
              width: '100%',
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '14px',
              border: 'none',
              borderRadius: '8px',
              cursor: (loading || !selectedImage) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '20px',
              fontWeight: 'bold',
              opacity: (loading || !selectedImage) ? 0.6 : 1
            }}
          >
            {loading ? '🔍 Analyzing Plant...' : '🔬 Detect Disease'}
          </button>
        </form>
        
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ 
              display: 'inline-block',
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #4caf50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ marginTop: '16px', color: '#666' }}>Analyzing plant image with AI...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        
        {apiError && (
          <div style={{ 
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            borderLeft: '4px solid #f44336'
          }}>
            <strong style={{ color: '#c62828' }}>⚠️ API Error:</strong>
            <p style={{ marginTop: '8px', color: '#333' }}>{apiError}</p>
            <details style={{ marginTop: '8px' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>Troubleshooting Tips</summary>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Check your internet connection</li>
                <li>Verify Gemini API key is valid</li>
                <li>Try uploading a clearer image</li>
                <li>Image should be less than 5MB</li>
              </ul>
            </details>
          </div>
        )}
        
        {error && !apiError && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            borderLeft: '4px solid #f44336',
            color: '#c62828'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {result && (
          <div style={{ marginTop: '40px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h2 style={{ margin: 0 }}>📋 Diagnosis Results</h2>
              <button 
                onClick={handleUploadNew}
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📸 + Upload New Image
              </button>
            </div>
            
            {/* Disease Name with Color */}
            <div style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: getDiseaseColor(result.disease_name, result.disease_type),
              color: 'white',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '28px' }}>
                {result.disease_name === 'Healthy Plant' ? '✅ ' : '⚠️ '}
                {result.disease_name}
              </h2>
              {result.scientific_name && result.disease_name !== 'Healthy Plant' && (
                <p style={{ marginTop: '8px', opacity: 0.9 }}>({result.scientific_name})</p>
              )}
            </div>
            
            {/* Main Information Table */}
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '30%' }}>Disease Type</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: result.disease_type === 'Fungal' ? '#fff3e0' : 
                                     result.disease_type === 'Bacterial' ? '#ffebee' :
                                     result.disease_type === 'Viral' ? '#f3e5f5' :
                                     result.disease_type === 'Nutrient Deficiency' ? '#e3f2fd' : '#e8f5e9',
                      color: getDiseaseColor(result.disease_name, result.disease_type)
                    }}>
                      {result.disease_type || 'Not specified'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Severity Level</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: result.severity === 'Mild' ? '#c8e6c9' :
                                     result.severity === 'Moderate' ? '#ffe0b2' :
                                     result.severity === 'Severe' ? '#ffcdd2' : '#e0e0e0',
                      color: result.severity === 'Mild' ? '#2e7d32' :
                             result.severity === 'Moderate' ? '#e65100' :
                             result.severity === 'Severe' ? '#c62828' : '#666'
                    }}>
                      {result.severity || 'Unknown'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Confidence Level</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ 
                        flex: 1, 
                        height: '8px', 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${result.confidence}%`, 
                          height: '100%', 
                          backgroundColor: result.confidence > 80 ? '#4caf50' : 
                                         result.confidence > 60 ? '#ff9800' : '#f44336',
                          borderRadius: '4px'
                        }}></div>
                      </div>
                      <span>{result.confidence}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Symptoms Table */}
            {result.symptoms && result.symptoms.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3>🌿 Observed Symptoms</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead style={{ backgroundColor: '#f5f5f5' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Symptom</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.symptoms.map((symptom, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', width: '50px' }}>{index + 1}</td>
                        <td style={{ padding: '12px' }}>{symptom}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Medicine 1 Table */}
            {result.medicine_1 && result.disease_name !== 'Healthy Plant' && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#4caf50' }}>💊 Treatment Option 1</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '30%' }}>Medicine Name</td>
                      <td style={{ padding: '12px' }}><strong>{result.medicine_1.name}</strong></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Type</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: result.medicine_1.type === 'Organic' ? '#e8f5e9' : '#fff3e0',
                          color: result.medicine_1.type === 'Organic' ? '#2e7d32' : '#e65100'
                        }}>
                          {result.medicine_1.type}
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Application Method</td>
                      <td style={{ padding: '12px' }}>{result.medicine_1.application}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Dosage</td>
                      <td style={{ padding: '12px' }}>{result.medicine_1.dosage}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Medicine 2 Table */}
            {result.medicine_2 && result.disease_name !== 'Healthy Plant' && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#ff9800' }}>🌱 Treatment Option 2 (Alternative)</h3>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5', width: '30%' }}>Medicine Name</td>
                      <td style={{ padding: '12px' }}><strong>{result.medicine_2.name}</strong></td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Type</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          backgroundColor: result.medicine_2.type === 'Organic' ? '#e8f5e9' : '#fff3e0',
                          color: result.medicine_2.type === 'Organic' ? '#2e7d32' : '#e65100'
                        }}>
                          {result.medicine_2.type}
                        </span>
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Application Method</td>
                      <td style={{ padding: '12px' }}>{result.medicine_2.application}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '12px', fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Dosage</td>
                      <td style={{ padding: '12px' }}>{result.medicine_2.dosage}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Description */}
            <div style={{
              padding: '16px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <strong>📖 Description:</strong>
              <p style={{ marginTop: '8px', lineHeight: '1.6' }}>{result.description}</p>
            </div>
            
            {/* Prevention Tips */}
            {result.prevention_tips && result.prevention_tips.length > 0 && (
              <div style={{
                padding: '16px',
                backgroundColor: '#e8f5e9',
                borderRadius: '8px',
                borderLeft: '4px solid #4caf50'
              }}>
                <strong>🛡️ Prevention Tips:</strong>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  {result.prevention_tips.map((tip, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {preview && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <h3>Analyzed Image</h3>
                <img src={preview} alt="Analyzed plant" style={{ 
                  maxWidth: '100%', 
                  maxHeight: '250px', 
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Disease;
