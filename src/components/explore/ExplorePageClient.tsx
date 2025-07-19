'use client';

import { useToast } from '@/components/ui/ToastContext';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ActivityMatch } from '@/types/activity';
import { ActivityCard } from '@/components/explore/activity-card';
import { AppHeader } from '@/components/layout/app-header';

function makeCacheKey(city: string, state: string, query: string, intl: boolean) {
  return `wonder_rec_${intl ? 'intl' : 'us'}_${city.toLowerCase()}_${state.toLowerCase()}_${query.toLowerCase()}`;
}

export default function ExplorePageClient() {
  const [cityState, setCityState] = useState({ city: '', state: '' });
  const [userQuery, setUserQuery] = useState('');
  const [isInternational, setIsInternational] = useState(false);
  const [recommendations, setRecommendations] = useState<ActivityMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [showLocationForm, setShowLocationForm] = useState(true);

  // Handle ?reset=1 query param and restore previous search when not resetting
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      sessionStorage.removeItem('wonder_last_search');
      setShowLocationForm(true);
      return;
    }
    // Restore last search if exists
    const saved = sessionStorage.getItem('wonder_last_search');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCityState({ city: parsed.city, state: parsed.state });
        setUserQuery(parsed.userQuery);
        setIsInternational(parsed.isInternational);
        setRecommendations(parsed.recommendations);
        setShowLocationForm(false);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  async function handleLocationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get('city') as string;
    const state = isInternational ? '' : (formData.get('state') as string);

    const cacheKey = makeCacheKey(city, state, userQuery, isInternational);
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as { ts: number; data: ActivityMatch[] };
        if (Date.now() - cached.ts < 24 * 60 * 60 * 1000) {
          setRecommendations(cached.data);
        }
      }
    } catch {}


    setCityState({ city, state });
    setShowLocationForm(false);
    setLoading(true);

    try {
      const geoRes = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, state, isInternational }),
      });
      const { lat, lng } = await geoRes.json();

      const recRes = await fetch('/api/activities/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: { lat, lng }, query: userQuery }),
      });
      const data = await recRes.json();
      if (!recRes.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      setRecommendations(data);
      // cache for future (24h)
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
      } catch {}
      sessionStorage.setItem(
        'wonder_last_search',
        JSON.stringify({
          city,
          state,
          userQuery,
          isInternational,
          recommendations: data,
        }),
      );
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      addToast(err instanceof Error ? err.message : 'An error occurred', { variant: 'error' });
      setShowLocationForm(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {!showLocationForm && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg font-medium">
              Showing recommendations for {cityState.city}
              {cityState.state ? `, ${cityState.state}` : ''}
            </p>
          )}
        {showLocationForm ? (
          <form onSubmit={handleLocationSubmit} className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                name="city"
                placeholder="City"
                className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
                required
              />
              {!isInternational && (
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  className="w-24 px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
                />
              )}
            </div>
            <div className="flex items-center gap-2 py-2 border-t border-b border-purple-100 dark:border-gray-800 my-2">
              <input
                type="checkbox"
                id="isInternational"
                name="isInternational"
                checked={isInternational}
                onChange={(e) => setIsInternational(e.target.checked)}
              />
              <label htmlFor="isInternational" className="text-gray-600 dark:text-gray-300">
                International city
              </label>
            </div>
            <input
              type="text"
              name="userQuery"
              placeholder="What are you interested in? (e.g., hiking, museums)"
              className="w-full px-4 py-3 border border-purple-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Find activities'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            
            {recommendations.map((match) => (
              <ActivityCard key={match.activity.id} match={match} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
