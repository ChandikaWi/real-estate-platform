import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from xgboost import XGBRegressor
import joblib

# Load Dataset
df = pd.read_csv('srilanka_properties.csv')

# Separate Features and Target
X = df[['city', 'type', 'bedrooms', 'bathrooms', 'area']]
y = df['price']

# Preprocessing Pipeline for Categorical and Numerical Data
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ['bedrooms', 'bathrooms', 'area']),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ['city', 'type'])
    ]
)

# Define XGBoost Regressor
model = XGBRegressor(
    n_estimators=1000,
    learning_rate=0.05,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

# Build and Train Full Pipeline
pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', model)])
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost Regressor...")
pipeline.fit(X_train, y_train)

# Evaluate Model Performance
score = pipeline.score(X_test, y_test)
print(f"✅ Model R-squared Accuracy: {score * 100:.2f}%")

# Save Pipeline to .pkl File
joblib.dump(pipeline, 'xgboost_model.pkl')
print("✅ Saved pipeline as xgboost_model.pkl")