import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Pagination,
  Box,
} from '@mui/material';
import DisasterMap from './maps/disasterMap';
import AssignPersonnelDialog from './fieldPersonnel/AssignPersonnelDialog';

interface LocationWeather {
  id: string;
  lat: number;
  lon: number;
  name: string;
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface RainyLocationCardProps {
  location: LocationWeather;
}

const RainyLocationCard: React.FC<RainyLocationCardProps> = ({ location }) => {
  const [assignedPersonnel, setAssignedPersonnel] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAssignPersonnel = (selectedPersonnel: string[]) => {
    setAssignedPersonnel(selectedPersonnel);
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s ease-in-out',
        '&:hover': {
          boxShadow: '0 6px 12px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ position: 'relative' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setDialogOpen(true)}
          sx={{ 
            position: 'absolute',
            top: 16,
            right: 16,
            minWidth: 'auto',
            padding: '6px 12px'
          }}
        >
          Assign
        </Button>
        <Typography variant="h6" gutterBottom sx={{ pr: 8 }}>
          {location.name}
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Temperature: {location.temperature}°C
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          Wind Speed: {location.windspeed} km/h
        </Typography>
        {assignedPersonnel.length > 0 && (
          <Typography color="textPrimary" gutterBottom>
            Assigned Personnel: {assignedPersonnel.join(', ')}
          </Typography>
        )}
      </CardContent>

      <AssignPersonnelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAssign={handleAssignPersonnel}
        latitude={location.lat}
        longitude={location.lon}
      />
    </Card>
  );
};

const LandingPage = () => {
  const [rainyLocations, setRainyLocations] = useState<LocationWeather[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 3;

  const totalPages = Math.ceil(rainyLocations.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = Math.min(startIndex + cardsPerPage, rainyLocations.length);
  const currentCards = rainyLocations.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  return (
    <Box sx={{ width: '100vw',height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header - now spans full width */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 2,
          backgroundColor: '#000',
          boxSizing: 'border-box',
        }}
      >
        <Typography variant="h4" sx={{ color: '#fff' }}>Geospatial Disaster Monitor System</Typography>
        <Button variant="contained">Login</Button>
      </Box>

      {/* Main content - split sidebar and map */}
      <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
        {/* Left Sidebar */}
        <Box
          sx={{
            width: '50%',
            pt: 2,
            pb: 2,
            pl: 2,
            pr: 0,
            overflowY: 'auto',
            backgroundColor: '#fff',
            boxSizing: 'border-sizing',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 'calc(100vh - 200px)' }}>
            {currentCards.map((location) => (
              <RainyLocationCard key={location.id} location={location} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 2, marginRight: 1, padding: '16px 0' }}>
            <Pagination 
              count={totalPages} 
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        </Box>

        {/* Right Map Area */}
        <Box
          sx={{
            width: '50%',
            height: '100%',
            backgroundColor: '#222',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <DisasterMap onRainyLocationsChange={setRainyLocations} />
        </Box>
      </Box>
    </Box>
  );
};

export default LandingPage;
