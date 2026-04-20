import React, { useState } from 'react';
import { useI18n } from '../i18n/i18nContext';
import { useAuth } from '../contexts/AuthContext';
import { logClientFeatureResult } from '../api/api';
import Swal from 'sweetalert2';

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

  // Convert file to base64 for API
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  // Detect if image contains plant/food using Gemini
  const detectImageContent = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: "Analyze this image and respond with ONLY a JSON object in this exact format: {\"isPlantOrFood\": true/false, \"category\": \"plant/food/other\", \"description\": \"brief description\"}. Determine if the image contains a plant (leaf, crop, tree, flower) or food (fruit, vegetable, grain). If it's a plant or food, set isPlantOrFood to true, otherwise false."
        }, {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }]
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"isPlantOrFood": false, "category": "other", "description": "Unable to analyze"}';
      
      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { isPlantOrFood: false, category: "other", description: "Could not determine" };
    } catch (error) {
      console.error('Error detecting image content:', error);
      return { isPlantOrFood: false, category: "other", description: "Analysis failed" };
    }
  };

  // Detect plant disease using Gemini
  const detectPlantDisease = async (base64Image) => {
    const GEMINI_API_KEY = 'AIzaSyDfIe8hVFhX0lGIExWLr28VeGwN2qzFZmU';
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: `You are an agricultural expert. Analyze this plant image and respond with ONLY a JSON object in this exact format:
{
  "disease": "name of disease or 'Healthy' if no disease",
  "confidence": confidence score between 0-100,
  "description": "detailed description of the disease or health condition",
  "treatment": "step-by-step treatment recommendations",
  "severity": "Low/Medium/High",
  "prevention": "prevention tips"
}`
        }, {
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        }]
      }]
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"disease": "Unknown", "confidence": 0, "description": "Unable to analyze", "treatment": "Consult an expert", "severity": "Unknown", "prevention": "Unknown"}';
      
      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {
        disease: "Unknown",
        confidence: 0,
        description: "Could not analyze the image",
        treatment: "Please consult an agricultural expert",
        severity: "Unknown",
        prevention: "N/A"
      };
    } catch (error) {
      console.error('Error detecting disease:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      Swal.fire({
        title: 'Error!',
        text: t('imageRequired') || 'Please select an image first',
        icon: 'error',
        confirmButtonColor: '#2e7d32'
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert image to base64
      const base64Image = await fileToBase64(selectedImage);
      
      // First, detect if the image contains a plant or food
      const contentAnalysis = await detectImageContent(base64Image);
      
      if (!contentAnalysis.isPlantOrFood) {
        // Show sweet alert for non-plant/food images
        await Swal.fire({
          title: 'Not a Plant or Food Item!',
          html: `<p>${contentAnalysis.description || 'The uploaded image does not appear to contain a plant or food item.'}</p>
                 <p>Please upload an image of:</p>
                 <ul style="text-align: left;">
                   <li>🌱 Plants or crops</li>
                   <li>🍎 Fruits or vegetables</li>
                   <li>🌿 Leaves or stems</li>
                   <li>🌾 Grains or seeds</li>
                 </ul>`,
          icon: 'warning',
          confirmButtonText: 'Upload Another Image',
          confirmButtonColor: '#2e7d32',
          allowOutsideClick: false
        });
        
        // Reset the form
        setSelectedImage(null);
        setPreview(null);
        setResult(null);
        setLoading(false);
        return;
      }
      
      // If it's a plant or food, proceed with disease detection
      const diseaseResult = await detectPlantDisease(base64Image);
      setResult(diseaseResult);
      
      // Log the result if user is authenticated
      if (token) {
        await logClientFeatureResult(token, {
          featureType: 'disease',
          request: { 
            imageFileName: selectedImage.name, 
            source: 'gemini_api',
            contentCategory: contentAnalysis.category
          },
          response: { success: true, data: diseaseResult }
        });
      }
      
      // Show success message based on detection
      if (diseaseResult.disease === 'Healthy' || diseaseResult.disease.toLowerCase().includes('healthy')) {
        Swal.fire({
          title: 'Great News! 🌟',
          text: 'Your plant appears to be healthy! No diseases detected.',
          icon: 'success',
          confirmButtonColor: '#2e7d32',
          timer: 3000
        });
      } else {
        Swal.fire({
          title: 'Disease Detected! ⚠️',
          text: `Detected: ${diseaseResult.disease}\nConfidence: ${diseaseResult.confidence}%\nSeverity: ${diseaseResult.severity}`,
          icon: 'info',
          confirmButtonColor: '#2e7d32'
        });
      }
      
    } catch (err) {
      console.error('Error:', err);
      Swal.fire({
        title: 'Error!',
        text: t('failedToGetDisease') || 'Failed to detect disease. Please try again.',
        icon: 'error',
        confirmButtonColor: '#2e7d32'
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAnother = () => {
    setSelectedImage(null);
    setPreview(null);
    setResult(null);
    setError(null);
    // Reset file input
    const fileInput = document.getElementById('image');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="disease-page">
      <div className="container">
        <h1>{t('diseaseDetectionTitle') || 'Plant Disease Detection'}</h1>
        <p>{t('diseaseDetectionDesc') || 'Upload an image of your plant to detect diseases using AI'}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="image">{t('uploadImage') || 'Upload Image'}</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
            <small>Supported formats: JPG, PNG, JPEG. Max size: 10MB</small>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (t('detecting') || 'Detecting...') : (t('detectDisease') || 'Detect Disease')}
          </button>
          
          {preview && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleUploadAnother}
              style={{ marginLeft: '10px' }}
            >
              {t('uploadAnother') || 'Upload Another'}
            </button>
          )}
        </form>
        
        {error && (
          <div className="error alert alert-danger" style={{ marginTop: '20px' }}>
            {error}
          </div>
        )}
        
        {preview && (
          <div className="image-preview" style={{ marginTop: '30px' }}>
            <h2>{t('selectedImage') || 'Selected Image'}</h2>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
            />
          </div>
        )}
        
        {result && (
          <div className="result" style={{ marginTop: '30px' }}>
            <h2>{t('detectionResult') || 'Detection Result'}</h2>
            <div className="card" style={{ 
              marginBottom: '1rem', 
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              backgroundColor: '#f9f9f9'
            }}>
              <h3 style={{ 
                color: result.disease === 'Healthy' || result.disease?.toLowerCase().includes('healthy') ? '#2e7d32' : '#d32f2f',
                marginBottom: '0.5rem'
              }}>
                {t('diseaseDetected') || 'Disease Detected'}: {result.disease}
              </h3>
              
              <p><strong>{t('confidenceLevel') || 'Confidence Level'}:</strong> {result.confidence}%</p>
              <p><strong>{t('severity') || 'Severity'}:</strong> 
                <span style={{ 
                  color: result.severity === 'High' ? '#d32f2f' : result.severity === 'Medium' ? '#ff9800' : '#4caf50',
                  fontWeight: 'bold',
                  marginLeft: '5px'
                }}>
                  {result.severity}
                </span>
              </p>
              <p><strong>{t('description') || 'Description'}:</strong> {result.description}</p>
              <p><strong>{t('treatmentAdvice') || 'Treatment Advice'}:</strong> {result.treatment}</p>
              <p><strong>{t('prevention') || 'Prevention Tips'}:</strong> {result.prevention}</p>
            </div>
            
            <button 
              onClick={handleUploadAnother}
              className="btn btn-primary"
              style={{ marginTop: '10px' }}
            >
              {t('analyzeAnotherPlant') || 'Analyze Another Plant'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Disease;
