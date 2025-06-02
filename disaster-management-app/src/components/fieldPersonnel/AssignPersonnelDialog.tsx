import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';

interface Personnel {
  govtId: string;
  name: string;
  status: string;
  reportingLocation: {
    type: string;
    coordinates: [number, number];
    name: string;
  };
}

interface AssignPersonnelDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (selectedPersonnel: string[]) => void;
  latitude: number;
  longitude: number;
}

const AssignPersonnelDialog: React.FC<AssignPersonnelDialogProps> = ({
  open,
  onClose,
  onAssign,
  latitude,
  longitude,
}) => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchNearbyPersonnel();
    }
  }, [open]);

  const fetchNearbyPersonnel = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching personnel from:', 'http://localhost:8000/field_personnel/');
      const response = await fetch('http://localhost:8000/field_personnel/');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array');
      }

      // Filter available personnel on the client side
      const availablePersonnel = data.filter(person => person.status === 'available');
      console.log('Available personnel:', availablePersonnel);
      setPersonnel(availablePersonnel);
      setSelectedIds([]);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch personnel');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (personnelId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(prev =>
      event.target.checked ? [...prev, personnelId] : prev.filter(id => id !== personnelId)
    );
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      setError(null);

      if (selectedIds.length === 0) {
        setError('No personnel selected');
        return;
      }

      const selectedPersonnel = personnel.filter(p => selectedIds.includes(p.govtId));

      for (const person of selectedPersonnel) {
        const requestBody = {
          personnel_id: person.govtId,
          assignedLocation: {
            type: "Point",
            coordinates: [longitude, latitude],
            name: "Assigned Location"
          },
          status: "assigned"
        };

        const response = await fetch('http://localhost:8000/field_personnel/assign', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.detail || `Failed to assign ${person.name}`);
        }
      }

      const assignedNames = selectedPersonnel.map(p => p.name);
      onAssign(assignedNames);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while assigning personnel');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Personnel</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : personnel.length === 0 ? (
          <Typography>No personnel available</Typography>
        ) : (
          <FormGroup>
            {personnel.map(person => (
              <FormControlLabel
                key={person.govtId}
                control={
                  <Checkbox
                    checked={selectedIds.includes(person.govtId)}
                    onChange={handleCheckboxChange(person.govtId)}
                    disabled={assigning}
                  />
                }
                label={`${person.name} (${person.govtId}) - ${person.reportingLocation.name}`}
                sx={{ color: 'black' }}
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={assigning}>Cancel</Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          color="primary"
          disabled={selectedIds.length === 0 || assigning}
          startIcon={assigning ? <CircularProgress size={18} /> : null}
        >
          {assigning ? 'Assigning...' : 'Assign Selected'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignPersonnelDialog;
