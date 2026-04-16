import sys
import json
import pickle
import numpy as np

def predict_irrigation(crop_type, soil_type, temperature, humidity, rainfall, season):
    try:
        # Load the trained model
        model_path = '../ml-models/irrigation_model.pkl'
        with open(model_path, 'rb') as file:
            model = pickle.load(file)
        
        # Encode categorical variables (in a real application, you'd use the same encoders used during training)
        # For now, using simple mapping - in real application, load the fitted encoders
        crop_mapping = {
            'rice': 0, 'wheat': 1, 'cotton': 2, 'sugarcane': 3, 'maize': 4,
            'jowar': 5, 'bajra': 6, 'barley': 7, 'peas': 8, 'tur': 9,
            'gram': 10, 'moong': 11, 'urad': 12, 'masoor': 13, 'sunflower': 14
        }
        
        soil_mapping = {
            'sandy': 0, 'loamy': 1, 'black': 2, 'red': 3, 'clayey': 4
        }
        
        season_mapping = {
            'kharif': 0, 'rabi': 1, 'zaid': 2
        }
        
        crop_encoded = crop_mapping.get(crop_type.lower(), 0)
        soil_encoded = soil_mapping.get(soil_type.lower(), 0)
        season_encoded = season_mapping.get(season.lower(), 0)
        
        # Prepare input data
        input_data = np.array([[float(temperature), float(humidity), float(rainfall), 
                                crop_encoded, soil_encoded, season_encoded]])
        
        # Make prediction
        prediction = model.predict(input_data)
        
        # Assuming the model returns irrigation method names
        result = {
            'recommended_irrigation': prediction[0] if len(prediction) > 0 else 'Unknown',
            'crop_type': crop_type,
            'soil_type': soil_type,
            'temperature': float(temperature),
            'humidity': float(humidity),
            'rainfall': float(rainfall),
            'season': season
        }
        
        return result
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) != 7:
        print(json.dumps({'error': 'Invalid number of arguments. Expected 6: crop_type, soil_type, temperature, humidity, rainfall, season'}))
        sys.exit(1)
    
    crop_type = sys.argv[1]
    soil_type = sys.argv[2]
    temperature = sys.argv[3]
    humidity = sys.argv[4]
    rainfall = sys.argv[5]
    season = sys.argv[6]
    
    result = predict_irrigation(crop_type, soil_type, temperature, humidity, rainfall, season)
    print(json.dumps(result))