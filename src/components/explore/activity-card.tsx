'use client';

import type { ActivityMatch } from '@/types/activity';
import { useActivityInterest } from '@/hooks/useActivityInterest';
import { useState } from 'react';
import dynamic from 'next/dynamic';
const ActivityChat = dynamic(() => import('./activity-chat'), { ssr: false });

interface ActivityCardProps {
  match: ActivityMatch;
}

export function ActivityCard({ match }: ActivityCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const { activity, score, matchReasons } = match;
  const { users, loading, toggleInterest } = useActivityInterest(activity.id);
  const joined = users.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {activity.imageUrl && (
        <img
          src={activity.imageUrl}
          alt={activity.name}
          className="w-full h-48 object-cover"
        />
      )}
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
            onClick={toggleInterest}
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
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>Price Level: {activity.priceLevel}</p>
            <p>Activity Level: {activity.activityLevel}</p>
            <p>Duration: {activity.duration} minutes</p>
          </div>
          <div className="mt-4">
            <h4 className="font-medium mb-2">Why this matches you:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
              {matchReasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {chatOpen && (
        <ActivityChat activityId={activity.id} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}

function calculateDistance(location: { lat: number; lng: number }): string {
  // TODO: Calculate actual distance from user's location
  return "2.5 miles";
}

function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
