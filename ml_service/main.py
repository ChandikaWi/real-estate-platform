from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="Real Estate AI Valuation API")

# Load model pipeline
try:
    model = joblib.load('xgboost_model.pkl')
except Exception as e:
    print("⚠️ Warning: Ensure xgboost_model.pkl exists in the ml_service folder.")

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
    try:
        # Convert incoming JSON payload to pandas DataFrame
        input_df = pd.DataFrame([data.dict()])
        
        # Run prediction
        prediction = model.predict(input_df)
        estimated_price = float(prediction[0])
        
        return {"estimated_price": max(0, estimated_price)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
