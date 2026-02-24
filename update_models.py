import csv
import json
import re

def count_stars(s):
    return s.count('★')

def count_dollar(s):
    return s.count('$')

def to_kebab(s):
    s = s.lower().replace('.', '').replace(',', '').replace(' ', '-')
    s = re.sub(r'-+', '-', s)
    return s

csv_path = r"c:\Users\bojan\OneDrive\Documenten\GitHub\NightCompanion\csv\nightcafe_models_compleet.csv"
ts_path = r"c:\Users\bojan\OneDrive\Documenten\GitHub\NightCompanion\src\lib\models-data.ts"

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    csv_models = list(reader)

# Map CSV to a dict by ID
csv_map = {}
for m in csv_models:
    name = m['Model']
    model_id = to_kebab(name)
    csv_map[model_id] = {
        'name': name,
        'description': m['Beschrijving'],
        'artRating': count_stars(m['Art (★)']),
        'promptingRating': count_stars(m['Prompting (★)']),
        'realismRating': count_stars(m['Realism (★)']),
        'typographyRating': count_stars(m['Typography (★)']),
        'costLevel': count_dollar(m['Kosten ($)']),
        'modelType': m['Type']
    }

# Read existing file to keep existing fields for matching models
with open(ts_path, 'r', encoding='utf-8') as f:
    ts_content = f.read()

# I'll just generate the new MODELS array part
# For simplicity, I'll update existing models and add missing ones
# Since I can't easily parse TS into a dict in Python without a proper parser, 
# I'll just create a new array from the CSV data and try to keep some structure.

final_models = []
for mid, data in csv_map.items():
    model = {
        "id": mid,
        "name": data['name'],
        "provider": "NightCafe", # Default for this CSV
        "description": data['description'],
        "strengths": [],
        "weaknesses": [],
        "bestFor": [],
        "styleTags": [],
        "qualityRating": data['artRating'], # Fallback
        "speedRating": 3,
        "keywords": [],
        "artRating": data['artRating'],
        "promptingRating": data['promptingRating'],
        "realismRating": data['realismRating'],
        "typographyRating": data['typographyRating'],
        "costLevel": data['costLevel'],
        "modelType": data['modelType']
    }
    
    # Heuristics for bestFor and styleTags based on ratings
    if data['realismRating'] >= 4:
        model['bestFor'].append('photorealistic')
        model['styleTags'].append('photorealistic')
    if data['artRating'] >= 4:
        model['styleTags'].append('artistic')
    if data['typographyRating'] >= 4:
        model['bestFor'].append('typography')
    if "Anime" in data['name'] or data['artRating'] >= 4:
         if "Anime" in data['name']:
             model['bestFor'].append('anime')
             model['styleTags'].append('anime')

    final_models.append(model)

models_json = json.dumps(final_models, indent=2)

# Update the interface first manually or via script
# Actually, I'll just output the JSON and the user can decide.
# No, I'll try to write it to a temp file and then I'll use it.

with open('updated_models.json', 'w', encoding='utf-8') as f:
    f.write(models_json)

print("Generated updated_models.json")
