'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActivityCategory, PreferenceLevel, UserPreferences } from '@/types/preferences';

const CATEGORIES: { id: ActivityCategory; label: string; description: string; icon: string }[] = [
  {
    id: 'food_drink',
    label: 'Food & Drink',
    description: 'Restaurants, cafes, bars, food tours, cooking classes',
    icon: '🍽️'
  },
  {
    id: 'outdoor_adventure',
    label: 'Outdoor & Adventure',
    description: 'Hiking, biking, kayaking, rock climbing',
    icon: '🏃‍♂️'
  },
  {
    id: 'sports',
    label: 'Sports',
    description: 'Golf, tennis, swimming, team sports',
    icon: '⛳'
  },
  {
    id: 'arts_culture',
    label: 'Arts & Culture',
    description: 'Museums, galleries, theaters, historical sites',
    icon: '🎨'
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    description: 'Bars, clubs, live music, entertainment',
    icon: '🌙'
  },
  {
    id: 'shopping',
    label: 'Shopping',
    description: 'Markets, malls, boutiques, local shops',
    icon: '🛍️'
  },
  {
    id: 'wellness',
    label: 'Wellness',
    description: 'Spa, yoga, meditation, fitness',
    icon: '🧘‍♀️'
  },
  {
    id: 'local_experiences',
    label: 'Local Experiences',
    description: 'Tours, workshops, unique local activities',
    icon: '🎯'
  }
];

export function PreferenceQuiz() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    categories: {
      food_drink: 'not_interested',
      outdoor_adventure: 'not_interested',
      sports: 'not_interested',
      arts_culture: 'not_interested',
      nightlife: 'not_interested',
      shopping: 'not_interested',
      wellness: 'not_interested',
      local_experiences: 'not_interested'
    },
    budget: 'moderate',
    activityLevel: 'medium',
    preferredTime: ['afternoon'],
    travelDistance: 10
  });

  const steps = [
    {
      title: 'Activity Categories',
      description: 'What kinds of activities interest you?',
      component: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => {
                const currentLevel = preferences.categories?.[category.id] || 'not_interested';
                const levels: PreferenceLevel[] = ['not_interested', 'somewhat_interested', 'very_interested'];
                const nextLevel = levels[(levels.indexOf(currentLevel) + 1) % levels.length];
                
                setPreferences(prev => ({
                  ...prev,
                  categories: {
                    ...(prev.categories as Record<ActivityCategory, PreferenceLevel>),
                    [category.id]: nextLevel
                  }
                }));
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{category.description}</p>
                  <div className="mt-2 flex gap-2">
                    {['not_interested', 'somewhat_interested', 'very_interested'].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-8 rounded-full ${
                          preferences.categories?.[category.id] === level
                            ? 'bg-purple-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'Budget Preference',
      description: 'What\'s your typical budget for activities?',
      component: (
        <div className="flex flex-col gap-4">
          {['budget', 'moderate', 'luxury'].map((budget) => (
            <button
              key={budget}
              className={`p-4 rounded-xl border ${
                preferences.budget === budget
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } hover:border-purple-500 transition-colors text-left`}
              onClick={() => setPreferences(prev => ({ ...prev, budget: budget as UserPreferences['budget'] }))}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{budget}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {budget === 'budget' && 'Free or low-cost activities'}
                {budget === 'moderate' && 'Mid-range activities and experiences'}
                {budget === 'luxury' && 'Premium experiences and exclusive activities'}
              </p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Activity Level',
      description: 'How active do you want to be?',
      component: (
        <div className="flex flex-col gap-4">
          {['low', 'medium', 'high'].map((level) => (
            <button
              key={level}
              className={`p-4 rounded-xl border ${
                preferences.activityLevel === level
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } hover:border-purple-500 transition-colors text-left`}
              onClick={() => setPreferences(prev => ({ ...prev, activityLevel: level as UserPreferences['activityLevel'] }))}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{level}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {level === 'low' && 'Relaxed, casual activities'}
                {level === 'medium' && 'Moderate physical activity'}
                {level === 'high' && 'High-energy, challenging activities'}
              </p>
            </button>
          ))}
        </div>
      )
    },
    {
      title: 'Travel Distance',
      description: 'How far are you willing to travel for activities?',
      component: (
        <div className="space-y-6">
          <input
            type="range"
            min="1"
            max="50"
            value={preferences.travelDistance}
            onChange={(e) => setPreferences(prev => ({ ...prev, travelDistance: parseInt(e.target.value) }))}
            className="w-full"
          />
          <div className="text-center text-gray-900 dark:text-white">
            Up to <span className="font-semibold">{preferences.travelDistance} miles</span>
          </div>
        </div>
      )
    }
  ];

  const handleSubmit = async () => {
    // TODO: Save preferences to backend
    console.log('Final preferences:', preferences);
    router.push('/explore');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {steps[step].title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {steps[step].description}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Step {step + 1} of {steps.length}
        </div>
      </div>

      {steps[step].component}

      <div className="flex justify-between mt-8">
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          className={`px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors ${
            step === 0 ? 'invisible' : ''
          }`}
        >
          Back
        </button>
        <button
          onClick={() => {
            if (step === steps.length - 1) {
              handleSubmit();
            } else {
              setStep(s => s + 1);
            }
          }}
          className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
        >
          {step === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
