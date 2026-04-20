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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Show custom alert
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

  // Check if image is a plant using Gemini
  const checkIfPlant = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `Analyze this image and determine if it contains a plant, crop, tree, flower, vegetable, fruit, or any agricultural vegetation. 
    Respond with ONLY ONE WORD: "YES" if it contains any plant material (including leaves, stems, flowers, fruits, vegetables, trees, crops), or "NO" if it does not contain any plant material (e.g., animals, people, buildings, empty soil, rocks, vehicles, etc.).
    Be strict: Only respond with YES or NO, nothing else.`;
    
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
          }]
        })
      });
      
      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();
      return answer === 'YES';
    } catch (error) {
      console.error('Error checking plant:', error);
      return false;
    }
  };

  // Detect plant disease using Gemini - REAL DATA ONLY
  const detectPlantDisease = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `You are an expert agricultural plant pathologist. Analyze this plant image and provide a REAL, ACCURATE disease diagnosis based on visible symptoms.
    
    Return ONLY valid JSON in this exact format (no other text):
    {
      "disease": "actual disease name or 'Healthy - No Disease Detected'",
      "confidence": 85,
      "description": "detailed description of visible symptoms on this specific plant",
      "treatment": "specific treatment recommendations for this exact condition",
      "symptoms_observed": ["symptom1", "symptom2", "symptom3"],
      "severity": "Mild/Moderate/Severe"
    }
    
    IMPORTANT: 
    - Analyze the actual image and provide REAL diagnosis based on what you see
    - Do NOT use generic responses
    - If the plant appears healthy, indicate that clearly
    - Provide specific, actionable advice
    - Confidence should reflect your certainty in the diagnosis`;
    
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
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('No response from Gemini API');
      }
      
      // Parse JSON from response
      let parsedResponse;
      try {
        // Try to parse the response directly
        parsedResponse = JSON.parse(textResponse);
      } catch (e) {
        // If response has extra text, extract JSON
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Invalid response format from API');
        }
      }
      
      // Validate required fields
      if (!parsedResponse.disease || !parsedResponse.description || !parsedResponse.treatment) {
        throw new Error('Incomplete response from API');
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error detecting disease:', error);
      throw new Error(`Disease detection failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      showAlert(t('imageRequired') || 'Please select an image', true);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(selectedImage);
      
      // First check if it's a plant
      showAlert('🔍 Analyzing image content...', false);
      const isPlant = await checkIfPlant(base64Image);
      
      if (!isPlant) {
        showAlert('❌ This does not appear to be a plant or crop. Please upload an image of a plant, leaf, flower, fruit, or vegetable for disease detection.', true);
        setLoading(false);
        setSelectedImage(null);
        setPreview(null);
        setResult(null);
        return;
      }
      
      // Detect disease using Gemini - REAL DATA
      showAlert('🌱 Plant detected! Analyzing for diseases...', false);
      const diseaseResult = await detectPlantDisease(base64Image);
      
      setResult({
        disease: diseaseResult.disease,
        confidence: diseaseResult.confidence,
        description: diseaseResult.description,
        treatment: diseaseResult.treatment,
        symptoms_observed: diseaseResult.symptoms_observed || [],
        severity: diseaseResult.severity || 'Not specified'
      });
      
      showAlert(`✅ Analysis complete! ${diseaseResult.disease === 'Healthy - No Disease Detected' ? 'Your plant appears healthy! 🌿' : 'Diagnosis ready. See recommendations below.'}`, false);
      
      // Log to backend if user is logged in
      if (token) {
        await logClientFeatureResult(token, {
          featureType: 'disease',
          request: { 
            imageFileName: selectedImage.name,
            timestamp: new Date().toISOString()
          },
          response: { 
            success: true, 
            data: diseaseResult 
          }
        });
      }
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to analyze image');
      showAlert(`❌ Error: ${err.message || 'Failed to analyze. Please try again with a clearer plant photo.'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadNew = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    document.getElementById('image-input').click();
  };

  return (
    <div className="disease-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="container">
        <h1>{t('diseaseDetectionTitle') || '🌿 AI Plant Disease Detection'}</h1>
        <p>{t('diseaseDetectionDesc') || 'Upload a clear photo of your plant for real-time disease diagnosis using Google Gemini AI'}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="image">{t('uploadImage') || '📸 Upload Plant Image'}</label>
            <input
              type="file"
              id="image-input"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
              style={{ 
                display: 'block', 
                padding: '10px', 
                border: '2px dashed #ccc', 
                borderRadius: '8px',
                width: '100%',
                cursor: 'pointer'
              }}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '8px' }}>
              Supported formats: JPG, PNG, JPEG (Max 10MB)
            </small>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              marginTop: '16px',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '🔍 Analyzing...' : '🔬 Detect Disease'}
          </button>
        </form>
        
        {error && (
          <div className="error" style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px',
            borderRadius: '8px',
            marginTop: '20px',
            borderLeft: '4px solid #c62828'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
        
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
        
        {preview && !result && !loading && (
          <div className="image-preview" style={{ marginTop: '30px' }}>
            <h2>{t('selectedImage') || 'Selected Image'}</h2>
            <img src={preview} alt="Preview" style={{ 
              maxWidth: '100%', 
              maxHeight: '400px', 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }} />
          </div>
        )}
        
        {result && (
          <div className="result" style={{ marginTop: '40px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h2 style={{ margin: 0 }}>{t('detectionResult') || '📋 Diagnosis Results'}</h2>
              <button 
                onClick={handleUploadNew}
                className="btn btn-secondary"
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
            
            <div className="card" style={{ 
              marginBottom: '1rem', 
              padding: '24px', 
              borderRadius: '12px', 
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              backgroundColor: 'white'
            }}>
              <div style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: result.disease === 'Healthy - No Disease Detected' ? '#e8f5e9' : '#fff3e0',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  color: result.disease === 'Healthy - No Disease Detected' ? '#2e7d32' : '#e65100', 
                  marginBottom: '8px',
                  fontSize: '24px'
                }}>
                  {result.disease === 'Healthy - No Disease Detected' ? '✅ ' : '⚠️ '}
                  {result.disease}
                </h3>
                
                {result.severity !== 'Not specified' && result.disease !== 'Healthy - No Disease Detected' && (
                  <p><strong>Severity Level:</strong> 
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: result.severity === 'Mild' ? '#4caf50' : result.severity === 'Moderate' ? '#ff9800' : '#f44336',
                      color: 'white',
                      fontSize: '14px'
                    }}>
                      {result.severity}
                    </span>
                  </p>
                )}
                
                <p><strong>Confidence Level:</strong> 
                  <span style={{ 
                    display: 'inline-block',
                    marginLeft: '8px',
                    padding: '4px 12px',
                    backgroundColor: result.confidence > 80 ? '#4caf50' : result.confidence > 60 ? '#ff9800' : '#f44336',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px'
                  }}>
                    {result.confidence}%
                  </span>
                </p>
              </div>
              
              {result.symptoms_observed && result.symptoms_observed.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>Symptoms Observed:</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    {result.symptoms_observed.map((symptom, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{symptom}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <strong>📖 Description:</strong><br />
                {result.description}
              </p>
              
              <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <strong>💊 Treatment Recommendations:</strong><br />
                {result.treatment}
              </p>
              
              <div style={{ 
                marginTop: '20px',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#666'
              }}>
                <strong>ℹ️ Note:</strong> This analysis is generated by AI and should be verified by a professional agronomist for critical decisions.
              </div>
            </div>
            
            {preview && (
              <div className="image-preview" style={{ marginTop: '20px', textAlign: 'center' }}>
                <h3>Analyzed Image</h3>
                <img src={preview} alt="Analyzed plant" style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
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
