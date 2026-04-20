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

  // Show alert without SweetAlert
  const showAlert = (message, isError = false) => {
    // Create custom alert div
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
    
    // Add animation styles if not exists
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

  // Detect plant disease using Gemini
  const detectPlantDisease = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const prompt = `You are an agricultural plant disease detection expert. Analyze this plant image and provide a detailed disease diagnosis. 
    Respond in valid JSON format ONLY with this exact structure:
    {
      "disease": "name of disease or 'Healthy' if no disease detected",
      "confidence": number between 0-100,
      "description": "detailed description of symptoms and what you observe",
      "treatment": "detailed treatment recommendations and prevention methods"
    }
    Make sure the response is ONLY valid JSON, no other text.`;
    
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
      
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
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
          throw new Error('Invalid response format');
        }
      }
      
      return parsedResponse;
    } catch (error) {
      console.error('Error detecting disease:', error);
      throw new Error('Failed to analyze plant disease');
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
      showAlert('Checking if image contains a plant...', false);
      const isPlant = await checkIfPlant(base64Image);
      
      if (!isPlant) {
        showAlert('❌ This does not appear to be a plant or crop. Please upload an image of a plant, leaf, flower, fruit, or vegetable for disease detection.', true);
        setLoading(false);
        // Reset for new upload
        setSelectedImage(null);
        setPreview(null);
        setResult(null);
        return;
      }
      
      // Detect disease
      showAlert('✅ Plant detected! Analyzing for diseases...', false);
      const diseaseResult = await detectPlantDisease(base64Image);
      
      setResult({
        disease: diseaseResult.disease,
        confidence: diseaseResult.confidence,
        description: diseaseResult.description,
        treatment: diseaseResult.treatment
      });
      
      showAlert(`Analysis complete! ${diseaseResult.disease === 'Healthy' ? 'Plant appears healthy! 🌱' : 'Disease detected. Check results below.'}`, false);
      
      // Log to backend if user is logged in
      if (token) {
        await logClientFeatureResult(token, {
          featureType: 'disease',
          request: { 
            imageFileName: selectedImage.name,
            source: 'gemini_api'
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
      showAlert('Error analyzing image. Please try again with a clearer plant photo.', true);
    } finally {
      setLoading(false);
    }
  };

  // Reset and upload new image
  const handleUploadNew = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    // Trigger file input click
    document.getElementById('image-input').click();
  };

  return (
    <div className="disease-page">
      <div className="container">
        <h1>{t('diseaseDetectionTitle') || 'Plant Disease Detection'}</h1>
        <p>{t('diseaseDetectionDesc') || 'Upload a photo of your plant to detect diseases using AI'}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="image">{t('uploadImage') || 'Upload Image'}</label>
            <input
              type="file"
              id="image-input"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
              style={{ display: 'block' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (t('detecting') || 'Detecting...') : (t('detectDisease') || 'Detect Disease')}
          </button>
        </form>
        
        {error && (
          <div className="error" style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '16px'
          }}>
            {error}
          </div>
        )}
        
        {preview && !result && (
          <div className="image-preview">
            <h2>{t('selectedImage') || 'Selected Image'}</h2>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
          </div>
        )}
        
        {result && (
          <div className="result">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2>{t('detectionResult') || 'Detection Result'}</h2>
              <button 
                onClick={handleUploadNew}
                className="btn btn-secondary"
                style={{
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {t('uploadNew') || '+ Upload New Image'}
              </button>
            </div>
            
            <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ 
                color: result.disease === 'Healthy' ? '#2e7d32' : '#c62828', 
                marginBottom: '0.5rem',
                fontSize: '1.5rem'
              }}>
                {t('diseaseDetected') || 'Disease Detected'}: {result.disease}
              </h3>
              
              <p><strong>{t('confidenceLevel') || 'Confidence Level'}:</strong> 
                <span style={{ 
                  display: 'inline-block',
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: result.confidence > 80 ? '#4caf50' : result.confidence > 60 ? '#ff9800' : '#f44336',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {result.confidence}%
                </span>
              </p>
              
              <p><strong>{t('description') || 'Description'}:</strong> {result.description}</p>
              
              <p><strong>{t('treatmentAdvice') || 'Treatment Advice'}:</strong> {result.treatment}</p>
            </div>
            
            {preview && (
              <div className="image-preview" style={{ marginTop: '20px' }}>
                <h3>Analyzed Image</h3>
                <img src={preview} alt="Analyzed plant" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Disease;
