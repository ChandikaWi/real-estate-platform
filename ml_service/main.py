from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os

app = FastAPI(title="Real Estate AI Valuation API")

# Load model pipeline
model = None
model_path = 'xgboost_model_v2.pkl'

if os.path.exists(model_path):
    try:
        model = joblib.load(model_path)
    except Exception as e:
        print(f"⚠️ Error loading {model_path}: {e}")
else:
    print(f"⚠️ Warning: Ensure {model_path} exists in the ml_service folder.")

# Schema matching
class PropertyData(BaseModel):
    city: str
    type: str
    bedrooms: int
    bathrooms: int
    area: float

@app.get("/")
def home():
    return {"message": "AI Valuation Service is Live"}

@app.post("/predict")
def predict_price(data: PropertyData):
    if model is None:
        raise HTTPException(status_code=503, detail="AI Valuation model is currently unavailable.")
        
    try:
        # Convert incoming JSON payload to pandas DataFrame
        input_data = data.dict()
        
        # Calculate engineered features
        bedrooms = max(1, input_data['bedrooms']) # Prevent division by zero
        input_data['area_per_bedroom'] = input_data['area'] / bedrooms
        input_data['bath_to_bed_ratio'] = input_data['bathrooms'] / bedrooms
        
        input_df = pd.DataFrame([input_data])
        
        # Run prediction (which returns log price)
        prediction = model.predict(input_df)
        
        # Reverse the log transformation
        estimated_price = float(np.expm1(prediction[0]))
        
        return {"estimated_price": max(0.0, estimated_price)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
