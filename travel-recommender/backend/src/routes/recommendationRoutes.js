const express = require('express');
const router = express.Router();
const { Activity } = require('../models/Activity');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  // In a real app, you would verify the JWT token here
  next();
};

// Get recommendations for a user (GET, legacy)
router.get('/recommendations', isAuthenticated, async (req, res) => {
  try {
    const activities = await Activity.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    res.json(activities);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

// Get recommendations for a user (POST, with quiz answers)
router.post('/recommendations', isAuthenticated, async (req, res) => {
  try {
    const { answers } = req.body;
    // Example: pick a category based on the last answer, fallback to 'outdoor'
    let category = 'outdoor';
    if (Array.isArray(answers) && answers.length > 0) {
      // Map quiz answers to categories if possible
      const answerToCategory = {
        foodie: 'food',
        museum: 'culture',
        adventure: 'outdoor',
        nature: 'outdoor',
        culture: 'culture',
        urban: 'entertainment',
        sights: 'history',
        locals: 'culture',
        balanced: 'entertainment',
        action: 'outdoor',
        relaxed: 'food',
      };
      // Try to map the last answer
      const last = answers[answers.length - 1];
      if (answerToCategory[last]) {
        category = answerToCategory[last];
      }
    }
    // Find activities matching the category, fallback to most recent
    let activities = await Activity.findAll({
      where: { category },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });
    if (!activities.length) {
      activities = await Activity.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']]
      });
    }
    res.json(activities);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Error getting recommendations' });
  }
});

// Get activity details
router.get('/activities/:id', isAuthenticated, async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({ message: 'Error getting activity details' });
  }
});

module.exports = router;
