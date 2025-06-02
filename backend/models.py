from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float]
    name: str

class FieldPersonnel(BaseModel):
    name: str
    govtId: str
    phoneNo: str
    reportingLocation: Location
    assignedLocation: Optional[Location] = None
    status: str = "available"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class FieldPersonnelCreate(BaseModel):
    name: str
    govtId: str
    phoneNo: str
    reportingLocation: Location
    status: str = "available"

class AssignLocationRequest(BaseModel):
    personnel_id: str
    assignedLocation: Location
    status: str = "assigned"

    class Config:
        json_schema_extra = {
            "example": {
                "personnel_id": "12345",
                "assignedLocation": {
                    "type": "Point",
                    "coordinates": [75.5, 11.0],
                    "name": "Assigned Location"
                },
                "status": "assigned"
            }
        }

class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 5.0 