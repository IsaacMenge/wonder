import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Profile = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Your Profile
      </Typography>
      <Typography variant="h5" color="text.secondary" paragraph>
        Manage your preferences and settings
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        {/* This will be replaced with actual profile content */}
        <Typography variant="body1">
          Your profile content will be displayed here
        </Typography>
      </Box>
    </Container>
  );
};

export default Profile;
