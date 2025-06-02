from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
from routes import router as field_personnel_router
from pymongo import MongoClient
from dotenv import dotenv_values

config = dotenv_values(".env")
app = FastAPI()

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"\n=== Incoming Request ===")
    print(f"Method: {request.method}")
    print(f"URL: {request.url}")
    print(f"Headers: {request.headers}")
    
    response = await call_next(request)
    
    print(f"Response Status: {response.status_code}")
    print("=== End Request ===\n")
    return response

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.get("/reverse-geocode")
async def reverse_geocode(lat: float, lon: float):
    url = f"https://geocoding-api.open-meteo.com/v1/reverse?latitude={lat}&longitude={lon}&language=en"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

@app.on_event("startup")
def start_db_client():
    app.mongodb_client = MongoClient(config["ATLAS_URI"])
    app.database = app.mongodb_client[config["DB_NAME"]]
    print("Connected to database")

@app.on_event("shutdown")
def shut_db_client():
    app.mongodb_client.close()

# Include the field personnel router
print("\n=== Router Setup ===")
print("Including field_personnel_router with prefix /field_personnel")
app.include_router(field_personnel_router, prefix="/field_personnel", tags=["field_personnel"])
print("Router included successfully")
print("=== End Router Setup ===\n")

# Add a test route to verify the server is working
@app.get("/test")
async def test_route():
    return {"message": "Server is running"}
