'use client';

import { useState, useEffect } from 'react';
import type { ActivityMatch } from '@/types/activity';
import { ActivityCard } from '@/components/explore/activity-card';
import { AppHeader } from '@/components/layout/app-header';

export default function ExplorePage() {
  const [cityState, setCityState] = useState({ city: '', state: '' });
  const [userQuery, setUserQuery] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [recommendations, setRecommendations] = useState<ActivityMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(true);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('wonder_last_search');
    if (saved) {
      const { city, state, userQuery, isInternational, recommendations } = JSON.parse(saved);
      setCityState({ city, state });
      setUserQuery(userQuery);
      setIsInternational(!!isInternational);
      setRecommendations(recommendations || []);
      setShowLocationForm(false);
    }
  }, []);

  async function handleLocationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get('city') as string;
    const state = isInternational ? '' : (formData.get('state') as string);

    setCityState({ city, state });
    setShowLocationForm(false);
    setLoading(true);

    try {
      // 1) Geocode city/state to lat/lng
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, isInternational }),
      });
      const geoData = await geoRes.json();
      if (!geoRes.ok) {
        throw new Error(geoData.error || 'Failed to geocode location');
      }
      const coords = geoData as { lat: number; lng: number };
      // setLocation removed: location state is no longer used in this component.coords);

      // 2) Fetch recommendations using those coordinates
      const recRes = await fetch('/api/activities/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: coords, query: userQuery, isInternational }),
      });

      const data = await recRes.json();

      if (!recRes.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data);
      setError(null);
      // Save search and results to sessionStorage
      sessionStorage.setItem(
        'wonder_last_search',
        JSON.stringify({
          city,
          state,
          userQuery,
          isInternational,
          recommendations: data
        })
      );
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setShowLocationForm(true); // Allow retrying
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Discover Activities Near You
        </h1>

        {showLocationForm ? (
          <div className="max-w-md mx-auto mb-10 p-8 bg-gradient-to-br from-white via-purple-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-purple-950 rounded-3xl shadow-xl border border-purple-100 dark:border-gray-800">
            <form onSubmit={handleLocationSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-2 text-center tracking-tight">Start Your Adventure</h2>
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  placeholder="e.g. Denver or Paris"
                  defaultValue="Denver"
                  className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
                  required
                />
              </div>
              <div className="flex items-center gap-2 py-2 border-t border-b border-purple-100 dark:border-gray-800 my-2">
                <input
                  type="checkbox"
                  id="isInternational"
                  name="isInternational"
                  checked={isInternational}
                  onChange={e => setIsInternational(e.target.checked)}
                  className="accent-purple-600 w-5 h-5"
                />
                <label htmlFor="isInternational" className="text-sm font-medium text-gray-700 dark:text-gray-200 select-none">
                  International city?
                </label>
              </div>
              {!isInternational && (
                <div>
                  <label htmlFor="state" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    placeholder="e.g. CO"
                    defaultValue="CO"
                    className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="userQuery" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  What are you in the mood for?
                </label>
                <input
                  type="text"
                  name="userQuery"
                  id="userQuery"
                  placeholder="e.g. bars, happy hour, live music, sushi, etc."
                  value={userQuery}
                  onChange={e => setUserQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg text-white font-bold text-lg tracking-wide transition transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
              >
                <span className="inline-flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  Find Activities
                </span>
              </button>
            </form>
          </div>
        ) : (
          <>
            <p className="text-center mb-8 text-gray-600 dark:text-gray-300">
              Showing activities near {cityState.city}, {cityState.state}
            </p>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Finding activities near you...</p>
              </div>
            ) : error ? (
              <div className="text-red-600 dark:text-red-400 text-center mb-4">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.filter(match => match.activity && match.activity.id).map((match) => (
                  <ActivityCard key={match.activity.id} match={match} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
