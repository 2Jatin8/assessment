from pymongo import MongoClient
from dotenv import dotenv_values
import json
import os
import datetime

# Try to load from .env, otherwise use defaults
try:
    config = dotenv_values(".env")
except:
    config = {}

# Default MongoDB connection if not in .env
MONGODB_URI = config.get("ATLAS_URI", "mongodb://localhost:27017")
DB_NAME = config.get("DB_NAME", "Staff_list")

# Sample field personnel data
personnel_data = [
    {
        "name": "John Smith",
        "govtId": "EMP001",
        "phoneNo": "9876543210",
        "reportingLocation": {
            "type": "Point",
            "coordinates": [72.8777, 19.0760],  # Mumbai
            "name": "Mumbai HQ"
        },
        "status": "available",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    },
    {
        "name": "Sarah Johnson",
        "govtId": "EMP002",
        "phoneNo": "9876543211",
        "reportingLocation": {
            "type": "Point",
            "coordinates": [73.8567, 18.5204],  # Pune
            "name": "Pune Office"
        },
        "status": "available",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    },
    {
        "name": "Michael Brown",
        "govtId": "EMP003",
        "phoneNo": "9876543212",
        "reportingLocation": {
            "type": "Point",
            "coordinates": [72.8777, 19.0760],  # Mumbai
            "name": "Mumbai Branch"
        },
        "status": "available",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    },
    {
        "name": "Emily Davis",
        "govtId": "EMP004",
        "phoneNo": "9876543213",
        "reportingLocation": {
            "type": "Point",
            "coordinates": [73.8567, 18.5204],  # Pune
            "name": "Pune Branch"
        },
        "status": "available",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    },
    {
        "name": "David Wilson",
        "govtId": "EMP005",
        "phoneNo": "9876543214",
        "reportingLocation": {
            "type": "Point",
            "coordinates": [72.8777, 19.0760],  # Mumbai
            "name": "Mumbai Center"
        },
        "status": "available",
        "createdAt": datetime.datetime.utcnow(),
        "updatedAt": datetime.datetime.utcnow()
    }
]

def seed_database():
    client = None
    try:
        print(f"Connecting to MongoDB at {MONGODB_URI}")
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        collection = db["field_personnel"]

        # Drop existing indexes
        print("Dropping existing indexes...")
        collection.drop_indexes()
        
        # Clear existing data
        print("Clearing existing data...")
        collection.delete_many({})

        # Create new indexes
        print("Creating new indexes...")
        collection.create_index([("reportingLocation", "2dsphere")])
        collection.create_index("govtId", unique=True)

        # Insert data
        print("Inserting new data...")
        result = collection.insert_many(personnel_data)
        print(f"Successfully inserted {len(result.inserted_ids)} documents")

        # Verify the data
        count = collection.count_documents({})
        print(f"Total documents in collection: {count}")

        # Print sample data
        print("\nSample data:")
        for doc in collection.find():
            print(json.dumps(doc, indent=2, default=str))

        # Verify available personnel
        available_personnel = list(collection.find({"status": "available"}))
        print(f"\nAvailable personnel in database:")
        for person in available_personnel:
            print(f"- {person['name']} ({person['govtId']})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    seed_database() 