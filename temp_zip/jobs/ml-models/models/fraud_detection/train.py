"""
Fraud detection model training.
Features: bet_amount, velocity_count, account_age_days, kyc_verified, unique_markets_today
Label: is_fraud (0/1)
"""
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

def generate_synthetic_data(n=10000):
    np.random.seed(42)
    normal_bets = np.column_stack([
        np.random.lognormal(8, 2, n//2),       # bet_amount
        np.random.randint(1, 10, n//2),          # velocity
        np.random.randint(30, 1000, n//2),       # account_age
        np.ones(n//2),                           # kyc_verified
        np.random.randint(1, 5, n//2),           # markets
    ])
    fraud_bets = np.column_stack([
        np.random.lognormal(11, 1, n//2),       # large amounts
        np.random.randint(15, 50, n//2),         # high velocity
        np.random.randint(1, 30, n//2),          # new accounts
        np.zeros(n//2),                          # not kyc
        np.random.randint(5, 20, n//2),          # many markets
    ])
    X = np.vstack([normal_bets, fraud_bets])
    y = np.concatenate([np.zeros(n//2), np.ones(n//2)])
    return X, y

if __name__ == "__main__":
    X, y = generate_synthetic_data()
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))
    os.makedirs(".", exist_ok=True)
    joblib.dump(model, "model.pkl")
    print("Model saved: model.pkl")
