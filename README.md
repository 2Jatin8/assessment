# Disaster Management Application

A full-stack application for managing field personnel and disaster response locations. The application allows users to assign field personnel to specific locations and track their status.

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Vite as the build tool

### Backend
- FastAPI (Python)
- MongoDB for database
- Uvicorn as ASGI server

## Prerequisites

1. Node.js (v14 or higher)
2. Python (v3.8 or higher)
3. MongoDB Atlas account
4. Git

## MongoDB Setup

### MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier is sufficient)
3. Set up database access:
   - Create a database user with read/write permissions
   - Note down the username and password
4. Set up network access:
   - Add your IP address to the IP whitelist
   - Or allow access from anywhere (0.0.0.0/0) for development
5. Get your connection string from the "Connect" button
6. Replace `<password>` in the connection string with your database user's password


### Using MongoDB Shell (mongosh)

1. Connect to your database:
```bash
# For MongoDB Atlas
mongosh "mongodb+srv://<cluster-name>.<cluster-id>.mongodb.net/" --apiVersion 1 --username <your-username>
# It will prompt for password : enter the password you saved earlier


```

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd assessment
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory with the following content:
```
ATLAS_URI=your_mongodb_connection_string
DB_NAME=Staff_list
```

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../disaster-management-app
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Running All Services Simultaneously

You'll need to run three different services in separate terminal windows:

1. **Terminal 1 - MongoDB Shell**
```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://<cluster-name>.<cluster-id>.mongodb.net/" --apiVersion 1 --username <your-username>
# It will prompt for password : enter the password you saved earlier
```

2. **Terminal 2 - Backend Server**
```bash
cd backend
# Activate virtual environment if not already activated
.\venv\Scripts\activate  # Windows
# OR
source venv/bin/activate  # Unix/MacOS

# Start the FastAPI or backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Terminal 3 - Frontend Server**
```bash
cd disaster-management-app
npm run dev
```

4. **Terminal 4 - Seed Data**
```bash
cd backend
python seed_data.py
```

Keep all three terminals open while working with the application. The services should be running at:
- MongoDB Shell: Connected to your Atlas cluster
- Backend: http://localhost:8000
- Frontend: http://localhost:5173

## API Endpoints

### Field Personnel Endpoints

- `GET /field_personnel/` - Get all field personnel
- `GET /field_personnel/available` - Get available field personnel
- `POST /field_personnel/nearby` - Find nearby personnel
- `PUT /field_personnel/assign` - Assign location to personnel

For detailed API documentation, including request/response schemas and testing endpoints: Open your browser and navigate to: `http://localhost:8000/docs`

You'll see the interactive Swagger UI documentation where you can:
- View all available endpoints
- Test API calls directly from the browser
- See request/response schemas
- View authentication requirements

## Features

1. View all field personnel
2. Filter available personnel
3. Assign personnel to locations
4. Track personnel status
5. Find nearby personnel based on location (not yet used in application)

## Application Workflow

### User Interface Layout
The application features a split-screen layout:
- **Left Side**: Cards displaying locations with current rainfall
- **Right Side**: Interactive map showing rainfall locations

### Main Features

1. **Location Cards (Left Side)**
   - Each card represents a location experiencing rainfall
   - Cards display location (latitude and longitude), temperature and windspeed
   - Each card has an "Assign" button
   - Clicking "Assign" opens a dialog with:
     - List of available field personnel
     - Personnel details (name, location)
     - Option to assign personnel to the location

2. **Interactive Map (Right Side)**
   - Displays all locations with rainfall
   - Click anywhere on the map to:
     - View weather information in a popup
     - See weather data
   - Map markers indicate:
     - Locations with rainfall

## Future Directions

The following features are planned for future development:

1. **Enhanced Rainfall Tracking**
   - Track amount of rainfall in centimeters
   - Display locations with heavy rainfall on the map
   - Implement rainfall intensity thresholds and alerts

2. **Intelligent Personnel Assignment**
   - Integration with real field personnel database
   - Assignment based on personnel's current location
   - Automatic assignment within 5km radius of disaster locations
   - Real-time location tracking of field personnel

3. **Security and Authentication**
   - Integration of OAuth 2.0 for secure authentication
   - Role-based access control
   - Secure API endpoints

4. **Disaster Management Workflow**
   - Facility to deassign staff when disaster is over
   - Status tracking of disaster resolution
   - Historical data of disaster responses
   - Performance metrics for response teams

5. **Advanced Map Interactions**
   - Interactive heat maps showing rainfall intensity
   - Click-to-assign functionality for field personnel
   - Custom map layers for different disaster types
   - Route optimization for personnel deployment
   - Mobile-responsive map controls
   - Offline map support for field operations

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify MongoDB connection string in `.env`
   - Check if MongoDB Atlas IP whitelist includes your IP

2. **Port Already in Use**
   - If port 8000 is in use, you can change it in the uvicorn command
   - If port 5173 is in use, you can change it in the Vite config




