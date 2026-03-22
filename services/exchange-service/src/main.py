import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Exchange Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "exchange-service"}

@app.get("/api/exchange/exposure")
async def get_exposure():
    return {"success": True, "data": {"totalExposure": 0, "positions": []}}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=3009, reload=True)
