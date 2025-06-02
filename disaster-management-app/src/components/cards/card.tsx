import React, { useState } from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import AssignPersonnelDialog from '../fieldPersonnel/AssignPersonnelDialog';

interface LocationWeather {
  id: string;
  lat: number;
  lon: number;
  name: string;
  temperature: number;
  windspeed: number;
  weathercode: number;
}

interface DisasterCardProps {
  location: LocationWeather;
}

const DisasterCard: React.FC<DisasterCardProps> = ({ location }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignedPersonnel, setAssignedPersonnel] = useState<string[]>([]);

  const handleAssignPersonnel = (selectedPersonnel: string[]) => {
    setAssignedPersonnel(selectedPersonnel);
  };

  return (
    <Card sx={{ marginBottom: 2, border: '1px solid #ccc', boxShadow: 3, position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
        <Button 
          variant="contained" 
          size="small"
          onClick={() => setDialogOpen(true)}
        >
          Assign Field Personnel
        </Button>
      </Box>
      <CardContent>
        <Typography variant="h6">{location.name}</Typography>
        <Typography variant="body2">Temperature: {location.temperature}°C</Typography>
        <Typography variant="body2">Wind Speed: {location.windspeed} km/h</Typography>
        <Typography variant="body2">Coordinates: ({location.lat.toFixed(2)}, {location.lon.toFixed(2)})</Typography>
        <Typography variant="body2">👤 {assignedPersonnel.length}</Typography>
        <Typography variant="body2">Evacuation</Typography>
        <Typography variant="body2">Total: 1200 People to be evacuated: 800 Already evacuated: 400</Typography>
        {assignedPersonnel.length > 0 && (
          <Typography variant="body2" color="primary">
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

export default DisasterCard;
