import sys
import json
import csv
import math
from pathlib import Path

def load_crop_dataset():
    """Load the crop recommendation dataset from CSV file"""
    dataset_path = Path(__file__).parent.parent / 'crop_recomendation' / 'Crop_recommendation.csv'
    
    if not dataset_path.exists():
        print(f"Dataset not found at: {dataset_path}", file=sys.stderr)
        return []
    
    dataset = []
    with open(dataset_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Convert numeric values
            processed_row = {}
            for key, value in row.items():
                try:
                    processed_row[key] = float(value)
                except ValueError:
                    processed_row[key] = value  # Keep as string if not numeric
            dataset.append(processed_row)
    
    print(f"Loaded {len(dataset)} records from crop recommendation dataset", file=sys.stderr)
    return dataset

def find_best_crop_recommendations(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
    """Find the best crop recommendations based on input parameters using similarity"""
    dataset = load_crop_dataset()
    
    if not dataset:
        return []
    
    # Calculate similarity scores for each record in the dataset
    scored_records = []
    for record in dataset:
        # Calculate Euclidean distance (lower distance means more similar)
        distance = math.sqrt(
            (record['N'] - nitrogen) ** 2 +
            (record['P'] - phosphorus) ** 2 +
            (record['K'] - potassium) ** 2 +
            (record['temperature'] - temperature) ** 2 +
            (record['humidity'] - humidity) ** 2 +
            (record['ph'] - ph) ** 2 +
            (record['rainfall'] - rainfall) ** 2
        )
        
        # Convert distance to similarity score (higher is better)
        similarity = 1 / (1 + distance)
        
        scored_records.append({
            **record,
            'similarity': similarity,
            'distance': distance
        })
    
    # Sort by similarity (descending)
    scored_records.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Get top recommendations
    top_recommendations = scored_records[:5]
    
    # Format the results
    results = []
    for i, rec in enumerate(top_recommendations):
        # Calculate confidence as a percentage (top score gets 100%, others scaled accordingly)
        confidence = min(100, round((rec['similarity'] / top_recommendations[0]['similarity']) * 100))
        
        results.append({
            'name': rec['label'],
            'nitrogen': rec['N'],
            'phosphorus': rec['P'],
            'potassium': rec['K'],
            'temperature': rec['temperature'],
            'humidity': rec['humidity'],
            'ph': rec['ph'],
            'rainfall': rec['rainfall'],
            'confidence': confidence,
            'rank': i + 1
        })
    
    return results

def predict_crop(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall):
    try:
        # Find recommendations using the dataset
        recommendations = find_best_crop_recommendations(
            float(nitrogen), float(phosphorus), float(potassium),
            float(temperature), float(humidity), float(ph), float(rainfall)
        )
        
        if recommendations:
            result = {
                'recommended_crop': recommendations[0]['name'],
                'all_recommendations': recommendations,
                'nitrogen': float(nitrogen),
                'phosphorus': float(phosphorus),
                'potassium': float(potassium),
                'temperature': float(temperature),
                'humidity': float(humidity),
                'ph': float(ph),
                'rainfall': float(rainfall)
            }
        else:
            result = {
                'recommended_crop': 'Unknown',
                'all_recommendations': [],
                'nitrogen': float(nitrogen),
                'phosphorus': float(phosphorus),
                'potassium': float(potassium),
                'temperature': float(temperature),
                'humidity': float(humidity),
                'ph': float(ph),
                'rainfall': float(rainfall),
                'error': 'No recommendations found in dataset'
            }
        
        return result
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) != 8:
        print(json.dumps({'error': 'Invalid number of arguments. Expected 7: nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall'}))
        sys.exit(1)
    
    nitrogen = sys.argv[1]
    phosphorus = sys.argv[2]
    potassium = sys.argv[3]
    temperature = sys.argv[4]
    humidity = sys.argv[5]
    ph = sys.argv[6]
    rainfall = sys.argv[7]
    
    result = predict_crop(nitrogen, phosphorus, potassium, temperature, humidity, ph, rainfall)
    print(json.dumps(result))