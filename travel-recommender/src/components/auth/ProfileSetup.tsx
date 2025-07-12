import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Container, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface Preference {
  category: string;
  value: boolean;
}

const ProfileSetup = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [preferences, setPreferences] = useState<Preference[]>([
    { category: 'food', value: false },
    { category: 'culture', value: false },
    { category: 'outdoor', value: false },
    { category: 'entertainment', value: false },
    { category: 'shopping', value: false },
    { category: 'history', value: false },
  ]);
  const navigate = useNavigate();

  const handlePreferenceChange = (category: string) => {
    setPreferences(prev => prev.map(pref => 
      pref.category === category ? { ...pref, value: !pref.value } : pref
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firstName,
          lastName,
          preferences: preferences.reduce((acc, pref) => {
            if (pref.value) acc.push(pref.category);
            return acc;
          }, [] as string[])
        }),
      });
      
      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to save profile');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('An error occurred while saving your profile');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Complete Your Profile
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="lastName"
            label="Last Name"
            type="text"
            id="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Box sx={{ mt: 2 }}>
            {preferences.map((pref) => (
              <FormControlLabel
                key={pref.category}
                control={
                  <Checkbox
                    checked={pref.value}
                    onChange={() => handlePreferenceChange(pref.category)}
                  />
                }
                label={pref.category}
              />
            ))}
          </Box>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Save Profile
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ProfileSetup;
