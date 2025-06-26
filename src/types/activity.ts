import { ActivityCategory } from './preferences';

export interface Location {
  lat: number;
  lng: number;
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  categories: ActivityCategory[];
  location: Location;
  priceLevel: 'free' | 'low' | 'medium' | 'high';
  activityLevel: 'low' | 'medium' | 'high';
  duration: number; // in minutes
  bestTimes: ('morning' | 'afternoon' | 'evening')[];
  imageUrl?: string;
  rating?: number;
  reviews?: number;
  website?: string;
}

export interface ActivityMatch {
  activity: Activity;
  score: number; // 0-100 match score
  matchReasons: string[]; // Why this was recommended
}
