from pymongo import MongoClient
from fastapi import Depends
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get MongoDB connection details from environment variables
MONGODB_URI = os.getenv("ATLAS_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "Staff_list")

# Create MongoDB client
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

def get_database():
    try:
        # Test the connection
        client.admin.command('ping')
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e 