export type ActivityCategory = 
  | 'food_drink'
  | 'outdoor_adventure'
  | 'sports'
  | 'arts_culture'
  | 'nightlife'
  | 'shopping'
  | 'wellness'
  | 'local_experiences';

export type PreferenceLevel = 'not_interested' | 'somewhat_interested' | 'very_interested';

export interface UserPreferences {
  categories: Record<ActivityCategory, PreferenceLevel>;
  budget: 'budget' | 'moderate' | 'luxury';
  activityLevel: 'low' | 'medium' | 'high';
  preferredTime: ('morning' | 'afternoon' | 'evening')[];
  travelDistance: number; // in miles
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'slider' | 'rating';
  options?: string[];
  min?: number;
  max?: number;
}
