import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom align="center">
        Travel Activity Recommender
      </Typography>
      <Typography variant="h5" color="text.secondary" align="center" paragraph>
        Discover amazing activities in your city based on your preferences
      </Typography>
      
      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/auth/login')}
          sx={{ width: '200px' }}
        >
          Get Started
        </Button>
        <Typography variant="body2" color="text.secondary" align="center">
          Already have an account?{' '}
          <Button color="primary" onClick={() => navigate('/auth/login')}>
            Sign in
          </Button>
        </Typography>
      </Box>
    </Container>
  );
};

export default Home;
