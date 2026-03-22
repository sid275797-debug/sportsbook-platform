import uvicorn
from fastapi import FastAPI
import numpy as np
import joblib
import os

app = FastAPI(title="ML Model Server", version="1.0.0")

models = {}

@app.on_event("startup")
async def load_models():
    for name in ["odds_adjustment", "fraud_detection"]:
        path = f"models/{name}/model.pkl"
        if os.path.exists(path):
            models[name] = joblib.load(path)
            print(f"Loaded model: {name}")

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(models.keys())}

@app.post("/predict/fraud")
async def predict_fraud(body: dict):
    if "fraud_detection" not in models:
        return {"score": 0.5, "message": "Model not loaded, using default"}
    features = np.array([[
        body.get("betAmount", 0),
        body.get("velocityCount", 0),
        body.get("accountAgeDays", 365),
        body.get("kycVerified", 1),
        body.get("uniqueMarketsToday", 1),
    ]])
    score = float(models["fraud_detection"].predict_proba(features)[0][1])
    return {"score": score, "flagged": score > 0.7}

@app.post("/predict/odds")
async def predict_odds_adjustment(body: dict):
    """Suggest odds adjustments based on betting patterns."""
    if "odds_adjustment" not in models:
        return {"adjustment": 0.0, "message": "Model not loaded"}
    features = np.array([[
        body.get("currentOdds", 2.0),
        body.get("betVolume", 0),
        body.get("timeToStart", 3600),
        body.get("homeAdvantage", 0),
    ]])
    adjustment = float(models["odds_adjustment"].predict(features)[0])
    return {"adjustment": adjustment, "suggestedOdds": body.get("currentOdds", 2.0) + adjustment}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3010, reload=True)
