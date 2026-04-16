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
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      setError(t('imageRequired'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call
      // For now, we'll simulate the response with more sophisticated logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate different disease detection based on image name or other factors
      const imageName = selectedImage.name.toLowerCase();
      
      // More sophisticated disease detection simulation
      let disease = '';
      let confidence = 0;
      let description = '';
      let treatment = '';
      
      // Detect disease based on keywords in file name
      if (imageName.includes('healthy')) {
        disease = 'Healthy';
        confidence = 98;
        description = 'No disease detected. The plant appears to be healthy.';
        treatment = 'No treatment required. Continue with regular care and maintenance.';
      } else if (imageName.includes('rust') || imageName.includes('brown')) {
        disease = 'Rust Disease';
        confidence = 92;
        description = 'Rust disease is a fungal infection that appears as brown, orange, or yellow pustules on leaves. It spreads quickly in humid conditions.';
        treatment = 'Apply fungicides containing triadimefon or propiconazole. Ensure proper air circulation and avoid overhead watering. Remove infected leaves immediately.';
      } else if (imageName.includes('blight') || imageName.includes('black')) {
        disease = 'Late Blight';
        confidence = 89;
        description = 'Late blight is a serious disease that causes dark, water-soaked lesions on leaves and stems. It spreads rapidly in cool, wet conditions.';
        treatment = 'Apply copper-based fungicides or mancozeb. Remove infected plants immediately. Avoid overhead watering and ensure good air circulation.';
      } else if (imageName.includes('mildew') || imageName.includes('white')) {
        disease = 'Powdery Mildew';
        confidence = 87;
        description = 'Powdery mildew appears as white, powdery spots on leaves and stems. It thrives in warm, dry conditions with high humidity.';
        treatment = 'Apply sulfur-based fungicides or neem oil. Increase air circulation and avoid overhead watering. Remove affected leaves.';
      } else if (imageName.includes('leaf') && imageName.includes('spot')) {
        disease = 'Leaf Spot Disease';
        confidence = 85;
        description = 'Leaf spot disease causes circular or irregular spots on leaves. It\'s caused by various fungi and bacteria.';
        treatment = 'Apply fungicides containing chlorothalonil or copper. Remove infected leaves and debris. Avoid wetting leaves when watering.';
      } else if (imageName.includes('wilt') || imageName.includes('yellow')) {
        disease = 'Fusarium Wilt';
        confidence = 83;
        description = 'Fusarium wilt causes yellowing and wilting of leaves, starting from the base of the plant. It\'s a soil-borne fungal disease.';
        treatment = 'Remove and destroy infected plants. Avoid planting in infested soil. Use resistant varieties and crop rotation.';
      } else {
        // Random disease detection if no keywords match
        const diseases = [
          {
            name: 'Healthy',
            desc: 'No disease detected. The plant appears to be healthy.',
            treat: 'No treatment required. Continue with regular care and maintenance.',
            conf: 95
          },
          {
            name: 'Nitrogen Deficiency',
            desc: 'Nitrogen deficiency causes yellowing of older leaves starting from the tips. The veins may remain green while the rest of the leaf turns yellow.',
            treat: 'Apply nitrogen-rich fertilizer such as urea or composted manure. Consider foliar feeding for quick results.',
            conf: 80
          },
          {
            name: 'Iron Deficiency',
            desc: 'Iron deficiency causes yellowing between the veins of young leaves, while the veins remain green. It\'s common in alkaline soils.',
            treat: 'Apply iron chelates or ferrous sulfate. Lower soil pH if it\'s too alkaline. Use foliar spray for quick results.',
            conf: 78
          },
          {
            name: 'Bacterial Spot',
            desc: 'Bacterial spot appears as small, water-soaked lesions on leaves that turn brown with yellow halos. It spreads in warm, humid conditions.',
            treat: 'Apply copper-based bactericides. Remove infected plants and debris. Avoid overhead watering and ensure good air circulation.',
            conf: 82
          }
        ];
        
        const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
        disease = randomDisease.name;
        description = randomDisease.desc;
        treatment = randomDisease.treat;
        confidence = randomDisease.conf;
      }
      
      // Mock response based on calculated values
      const mockResponse = {
        disease: disease,
        confidence: confidence,
        description: description,
        treatment: treatment,
      };
      
      setResult(mockResponse);
      if (token) {
        logClientFeatureResult(token, {
          featureType: 'disease',
          request: { imageFileName: selectedImage.name, source: 'client_simulation' },
          response: { success: true, data: mockResponse }
        });
      }
    } catch (err) {
      setError(t('failedToGetDisease'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="disease-page">
      <div className="container">
        <h1>{t('diseaseDetectionTitle')}</h1>
        <p>{t('diseaseDetectionDesc')}</p>
        
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label htmlFor="image">{t('uploadImage')}</label>
            <input
              type="file"
              id="image"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('detecting') : t('detectDisease')}
          </button>
        </form>
        
        {error && <div className="error">{error}</div>}
        
        {preview && (
          <div className="image-preview">
            <h2>{t('selectedImage')}</h2>
            <img src={preview} alt="Preview" />
          </div>
        )}
        
        {result && (
          <div className="result">
            <h2>{t('detectionResult')}</h2>
            <div className="card" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
              <h3 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>
                {t('diseaseDetected')}: {result.disease}
              </h3>
              <p><strong>{t('confidenceLevel')}:</strong> {result.confidence}%</p>
              <p><strong>{t('description')}:</strong> {result.description}</p>
              <p><strong>{t('treatmentAdvice')}:</strong> {result.treatment}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Disease;