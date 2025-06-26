'use client';

import { useState } from 'react';
import type { Activity, ActivityMatch, Location } from '@/types/activity';
import { ActivityCard } from '@/components/explore/activity-card';
import { AppHeader } from '@/components/layout/app-header';

// Default coordinates for Denver
const DENVER_COORDS: Location = {
  lat: 39.7392,
  lng: -104.9903
};

export default function ExplorePage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [cityState, setCityState] = useState({ city: '', state: '' });
  const [recommendations, setRecommendations] = useState<ActivityMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(true);

  async function handleLocationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;

    setCityState({ city, state });
    setShowLocationForm(false);
    setLoading(true);

    try {
      // 1) Geocode city/state to lat/lng
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state }),
      });
      const geoData = await geoRes.json();
      if (!geoRes.ok) {
        throw new Error(geoData.error || 'Failed to geocode location');
      }
      const coords = geoData as { lat: number; lng: number };
      setLocation(coords);

      // 2) Fetch recommendations using those coordinates
      const recRes = await fetch('/api/activities/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: coords }),
      });

      const data = await recRes.json();

      if (!recRes.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data);
      setError(null);
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
          <div className="max-w-md mx-auto mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  placeholder="e.g. Denver"
                  defaultValue="Denver"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium mb-1">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  id="state"
                  placeholder="e.g. CO"
                  defaultValue="CO"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
              >
                Find Activities
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
                {recommendations.map((match) => (
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
