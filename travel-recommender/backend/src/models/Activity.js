const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('food', 'culture', 'outdoor', 'entertainment', 'shopping', 'history'),
    allowNull: false
  },
  location: {
    type: DataTypes.JSON,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  price: {
    type: DataTypes.ENUM('free', 'inexpensive', 'moderate', 'expensive'),
    allowNull: false
  },
  hours: {
    type: DataTypes.JSON,
    allowNull: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  }
});

module.exports = Activity;
