from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI(title="Journey Planner API")

# Configure CORS for the frontend Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Journey Planner Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
