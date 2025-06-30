'use client';

import type { ActivityMatch } from '@/types/activity';
import { useActivityInterest } from '@/hooks/useActivityInterest';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useUnsplashImage } from '@/hooks/useUnsplashImage';
const ActivityChat = dynamic(() => import('./activity-chat'), { ssr: false });

interface ActivityCardProps {
  match: ActivityMatch;
}

export function ActivityCard({ match }: ActivityCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const { activity, score, matchReasons } = match;
  const { users, loading, toggleInterest } = useActivityInterest(activity.id);
  const joined = users.length > 0;
  // Get Unsplash image (prefer activity name, fallback to category)
  const { url: unsplashUrl, loading: imgLoading } = useUnsplashImage(activity.name + ' ' + (activity.categories[0] || ''));

  // Helper to make reasons more natural
  function prettifyMatchReasons(reasons: string[]): string {
    // Patterns for common match reasons
    const output: string[] = [];
    for (let r of reasons) {
      r = r.trim();
      if (/category/i.test(r)) {
        const match = r.match(/category of ([\w\s]+)/i);
        if (match) output.push(`You enjoy ${match[1].toLowerCase()} activities.`);
      } else if (/activity level is/i.test(r)) {
        const match = r.match(/activity level is ([\w]+),/i);
        if (match) output.push(`This activity matches your preferred pace (${match[1].toLowerCase()}).`);
      } else if (/duration is within/i.test(r)) {
        output.push('It fits your preferred time of day.');
      } else if (/location is within/i.test(r)) {
        output.push('It’s close to you.');
      } else if (/price level is/i.test(r)) {
        const match = r.match(/price level is ([\w]+),/i);
        if (match) output.push(`It’s ${match[1].toLowerCase()}-priced, matching your budget.`);
      } else if (/shown somewhat interested in ([\w\s]+)/i.test(r)) {
        const match = r.match(/shown somewhat interested in ([\w\s]+)/i);
        if (match) output.push(`You like ${match[1].toLowerCase()} experiences.`);
      } else {
        output.push(r.replace(/activity|user|category|preference/gi, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim());
      }
    }
    // Remove duplicates and join into a paragraph
    return Array.from(new Set(output)).join(' ');
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      <div className="relative w-full h-56 bg-gray-100 dark:bg-gray-700">
        {imgLoading ? (
          <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-200 dark:bg-gray-700" />
        ) : (
          <img
            src={unsplashUrl || activity.imageUrl || '/default-activity.jpg'}
            alt={activity.name}
            className="w-full h-full object-cover object-center transition-all duration-300"
            style={{ minHeight: 180 }}
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{activity.name}</h3>
          <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm">
            {score}% Match
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {activity.description}
        </p>
        <div className="space-y-2">
          <button
            onClick={async () => {
              // Upsert the activity into the activity table
              const payload = {
                name: activity.name,
                description: activity.description,
                image_url: unsplashUrl || activity.imageUrl || null,
                price_level: activity.priceLevel || null,
                activity_level: activity.activityLevel || null,
                duration: activity.duration || null,
                
                website_url: activity.website || null,
                categories: Array.isArray(activity.categories) ? activity.categories : (activity.categories ? [activity.categories] : null),
              };
              const { data: upserted, error: upsertErr } = await (await import('@/lib/supabase')).supabase
                .from('activity')
                .upsert([payload])
                .select();
              if (upsertErr || !upserted || upserted.length === 0) {
                // Debug info
                alert('Error saving activity! ' + (upsertErr?.message || 'Unknown error') + '\nPayload: ' + JSON.stringify(payload));
                return;
              }
              const act = upserted[0];
              // Insert into activity_interest (if not already)
              await toggleInterest();
              window.location.href = `/activity/${act.id}`;
            }}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${joined ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'} disabled:opacity-50`}
          >
            {loading ? 'Saving…' : joined ? `Joined (${users.length})` : "I'm Interested"}
          </button>
          <button
            onClick={() => setChatOpen(true)}
            className="ml-2 px-4 py-2 rounded-full text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Chat
          </button>
          <div className="flex flex-wrap gap-2">
            {activity.categories.map((category) => (
              <span
                key={category}
                className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm"
              >
                {category.replace('_', ' ')}
              </span>
            ))}
          </div>
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <div className="flex items-center gap-1"><span role="img" aria-label="Price">💲</span>{activity.priceLevel}</div>
            <div className="flex items-center gap-1"><span role="img" aria-label="Activity Level">⚡</span>{activity.activityLevel}</div>
            <div className="flex items-center gap-1"><span role="img" aria-label="Duration">⏱️</span>{activity.duration} min</div>
          </div>
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/40 border border-purple-100 dark:border-purple-800 rounded-lg p-3 text-sm text-purple-900 dark:text-purple-100">
            <h4 className="font-medium mb-1">Why this matches you:</h4>
            <span>{prettifyMatchReasons(matchReasons)}</span>
          </div>
        </div>
      </div>
      {chatOpen && (
        <ActivityChat activityId={activity.id} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}
