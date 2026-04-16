import sys
import json
import csv
import math
from pathlib import Path

def load_fertilizer_dataset():
    """Load the fertilizer recommendation dataset from CSV file"""
    dataset_path = Path(__file__).parent.parent / 'fertilizer_recommendation' / 'fertilizer_recommendation_dataset.csv'
    
    if not dataset_path.exists():
        print(f"Dataset not found at: {dataset_path}", file=sys.stderr)
        return []
    
    dataset = []
    with open(dataset_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Convert numeric values (first 8 columns are numeric)
            processed_row = {}
            numeric_columns = ['Temperature', 'Moisture', 'Rainfall', 'PH', 'Nitrogen', 'Phosphorous', 'Potassium', 'Carbon']
            for key, value in row.items():
                if key in numeric_columns:
                    try:
                        processed_row[key] = float(value)
                    except ValueError:
                        processed_row[key] = value  # Keep as string if not numeric
                else:
                    processed_row[key] = value  # Keep categorical values as strings
            dataset.append(processed_row)
    
    print(f"Loaded {len(dataset)} records from fertilizer recommendation dataset", file=sys.stderr)
    return dataset

def find_best_fertilizer_recommendations(crop_type, soil_type, nitrogen, phosphorus, potassium):
    """Find the best fertilizer recommendations based on input parameters using similarity"""
    dataset = load_fertilizer_dataset()
    
    if not dataset:
        return []
    
    # Filter dataset based on crop and soil type
    filtered_records = [record for record in dataset 
                       if record['Crop'].lower() == crop_type.lower() and 
                          record['Soil'].lower() == soil_type.lower()]
    
    # If no exact match, find records with similar crop type
    if not filtered_records:
        filtered_records = [record for record in dataset 
                           if record['Crop'].lower() == crop_type.lower()]
    
    # If still no match, find records with similar soil type
    if not filtered_records:
        filtered_records = [record for record in dataset 
                           if record['Soil'].lower() == soil_type.lower()]
    
    # If still no match, use all records
    if not filtered_records:
        filtered_records = dataset
    
    # Calculate similarity scores for each record in the filtered dataset
    scored_records = []
    for record in filtered_records:
        # Calculate Euclidean distance based on nutrient values
        distance = math.sqrt(
            (record['Nitrogen'] - nitrogen) ** 2 +
            (record['Phosphorous'] - phosphorus) ** 2 +
            (record['Potassium'] - potassium) ** 2
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
            'fertilizer': rec['Fertilizer'],
            'crop': rec['Crop'],
            'soil': rec['Soil'],
            'nitrogen': rec['Nitrogen'],
            'phosphorus': rec['Phosphorous'],
            'potassium': rec['Potassium'],
            'temperature': rec['Temperature'],
            'moisture': rec['Moisture'],
            'ph': rec['PH'],
            'carbon': rec['Carbon'],
            'rainfall': rec['Rainfall'],
            'remark': rec['Remark'],
            'confidence': confidence,
            'rank': i + 1
        })
    
    return results

def predict_fertilizer(crop_type, soil_type, nitrogen, phosphorus, potassium):
    try:
        # Find recommendations using the dataset
        recommendations = find_best_fertilizer_recommendations(
            crop_type, soil_type, float(nitrogen), float(phosphorus), float(potassium)
        )
        
        if recommendations:
            result = {
                'recommended_fertilizer': recommendations[0]['fertilizer'],
                'all_recommendations': recommendations,
                'crop_type': crop_type,
                'soil_type': soil_type,
                'nitrogen': float(nitrogen),
                'phosphorus': float(phosphorus),
                'potassium': float(potassium)
            }
        else:
            result = {
                'recommended_fertilizer': 'Unknown',
                'all_recommendations': [],
                'crop_type': crop_type,
                'soil_type': soil_type,
                'nitrogen': float(nitrogen),
                'phosphorus': float(phosphorus),
                'potassium': float(potassium),
                'error': 'No recommendations found in dataset'
            }
        
        return result
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) != 6:
        print(json.dumps({'error': 'Invalid number of arguments. Expected 5: crop_type, soil_type, nitrogen, phosphorus, potassium'}))
        sys.exit(1)
    
    crop_type = sys.argv[1]
    soil_type = sys.argv[2]
    nitrogen = sys.argv[3]
    phosphorus = sys.argv[4]
    potassium = sys.argv[5]
    
    result = predict_fertilizer(crop_type, soil_type, nitrogen, phosphorus, potassium)
    print(json.dumps(result))