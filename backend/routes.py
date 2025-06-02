from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.collection import Collection
from bson import ObjectId
from typing import List
from models import FieldPersonnel, AssignLocationRequest, NearbySearchRequest, FieldPersonnelCreate

router = APIRouter()

def get_personnel_collection(request: Request) -> Collection:
    try:
        print("\n=== Database Collection Access ===")
        print(f"Database name: {request.app.database.name}")
        print(f"Collection name: field_personnel")
        
        if not hasattr(request.app, 'database'):
            raise HTTPException(status_code=500, detail="Database not initialized")
            
        collection = request.app.database["field_personnel"]
        print("Collection accessed successfully")
        print("=== End Database Access ===\n")
        return collection
    except Exception as e:
        print(f"Error accessing database collection: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

def convert_id(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.get("/", response_model=List[FieldPersonnel])
async def get_all_personnel(request: Request, collection: Collection = Depends(get_personnel_collection)):
    try:
        print("\n=== Get All Personnel Request ===")
        print(f"Request URL: {request.url}")
        print(f"Request method: {request.method}")
        print(f"Request headers: {request.headers}")
        
        # Get all personnel
        personnel = list(collection.find())
        print(f"Found {len(personnel)} personnel")
        
        # Convert ObjectIds to strings
        personnel = [convert_id(p) for p in personnel]
        print(f"Returning {len(personnel)} personnel")
        print("=== End Get All Personnel Request ===\n")
        
        return personnel
    except Exception as e:
        print(f"Error in get_all_personnel: {str(e)}")
        print(f"Error type: {type(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching personnel: {str(e)}")

@router.get("/available", response_model=List[FieldPersonnel])
async def get_available_personnel(collection: Collection = Depends(get_personnel_collection)):
    try:
        print("Fetching available personnel...")
        personnel = list(collection.find({"status": "available"}))
        print(f"Found {len(personnel)} available personnel")
        personnel = [convert_id(p) for p in personnel]
        return personnel
    except Exception as e:
        print(f"Error fetching personnel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching personnel: {str(e)}")

@router.post("/nearby")
async def find_nearby_personnel(query: NearbySearchRequest, collection: Collection = Depends(get_personnel_collection)):
    # Ensure a 2dsphere index exists
    collection.create_index([("reportingLocation", "2dsphere")])
    
    query_point = {
        "type": "Point",
        "coordinates": [query.longitude, query.latitude]
    }

    nearby = collection.find({
        "reportingLocation": {
            "$near": {
                "$geometry": query_point,
                "$maxDistance": query.radius_km * 1000  # Convert to meters
            }
        },
        "status": "available"
    })

    return [
        {
            "_id": str(doc["_id"]),
            "name": doc["name"],
            "govtId": doc["govtId"],
            "reportingLocation": doc["reportingLocation"],
            "status": doc["status"]
        }
        for doc in nearby
    ]

@router.put("/assign")
async def assign_location_to_personnel(req: AssignLocationRequest, collection: Collection = Depends(get_personnel_collection)):
    try:
        print("\n=== Assign Location Request ===")
        print(f"Received request body: {req.dict()}")
        print(f"Personnel ID (govtId): {req.personnel_id}")
        print(f"Location data: {req.assignedLocation}")

        if not req.personnel_id:
            raise HTTPException(status_code=400, detail="Personnel ID is required")

        # First check if personnel exists using govtId
        print(f"\nSearching for personnel with govtId: {req.personnel_id}")
        personnel = collection.find_one({"govtId": req.personnel_id})
        print(f"Found personnel: {personnel}")

        if not personnel:
            print(f"No personnel found with govtId: {req.personnel_id}")
            # Let's check what personnel we do have in the database
            all_personnel = list(collection.find({}, {"govtId": 1, "name": 1}))
            print(f"Available personnel in database: {all_personnel}")
            raise HTTPException(status_code=404, detail=f"Personnel not found with ID: {req.personnel_id}")

        # Update the personnel record
        update_data = {
            "assignedLocation": req.assignedLocation.dict(),
            "status": "assigned"
        }
        print(f"\nUpdating personnel with data: {update_data}")

        result = collection.update_one(
            {"govtId": req.personnel_id},
            {"$set": update_data}
        )
        print(f"Update result: {result.raw_result}")

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to update personnel record")

        # Verify the update
        updated_personnel = collection.find_one({"govtId": req.personnel_id})
        print(f"\nUpdated personnel record: {updated_personnel}")
        print(f"Updated personnel status: {updated_personnel.get('status')}")

        print(f"\nSuccessfully assigned location to personnel: {req.personnel_id}")
        return {
            "message": "Location assigned successfully",
            "personnel_id": req.personnel_id,
            "assignedLocation": req.assignedLocation.dict(),
            "status": "assigned"
        }

    except HTTPException as he:
        print(f"\nHTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        print(f"\nError assigning location: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error assigning location: {str(e)}")

@router.get("/{personnel_id}", response_model=FieldPersonnel)
async def get_personnel(personnel_id: str, collection: Collection = Depends(get_personnel_collection)):
    if not ObjectId.is_valid(personnel_id):
        raise HTTPException(status_code=400, detail="Invalid personnel ID")
    personnel = collection.find_one({"_id": ObjectId(personnel_id)})
    if not personnel:
        raise HTTPException(status_code=404, detail="Personnel not found")
    return convert_id(personnel)

@router.post("/", response_model=FieldPersonnel)
async def create_personnel(personnel: FieldPersonnelCreate, collection: Collection = Depends(get_personnel_collection)):
    result = collection.insert_one(personnel.dict())
    created_personnel = collection.find_one({"_id": result.inserted_id})
    return convert_id(created_personnel)

@router.put("/{personnel_id}", response_model=FieldPersonnel)
async def update_personnel(personnel_id: str, personnel: FieldPersonnelCreate, collection: Collection = Depends(get_personnel_collection)):
    if not ObjectId.is_valid(personnel_id):
        raise HTTPException(status_code=400, detail="Invalid personnel ID")

    update_result = collection.update_one(
        {"_id": ObjectId(personnel_id)},
        {"$set": personnel.dict()}
    )
    
    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Personnel not found")
    
    updated_personnel = collection.find_one({"_id": ObjectId(personnel_id)})
    return convert_id(updated_personnel)

@router.delete("/{personnel_id}")
async def delete_personnel(personnel_id: str, collection: Collection = Depends(get_personnel_collection)):
    if not ObjectId.is_valid(personnel_id):
        raise HTTPException(status_code=400, detail="Invalid personnel ID")
    
    result = collection.delete_one({"_id": ObjectId(personnel_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Personnel not found")
    return {"message": "Personnel deleted successfully"}
