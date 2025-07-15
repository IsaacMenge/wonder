"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useUnsplashImage } from '@/hooks/useUnsplashImage';
import ActivityChat from './activity-chat';

interface ActivityDetailProps {
  activity: import('@/types/activity').Activity;
}

import { useRouter } from 'next/navigation';

export default function ActivityDetail({ activity }: ActivityDetailProps) {
  const [openChat, setOpenChat] = useState(false);
  const { url: unsplashUrl } = useUnsplashImage(activity?.name || '');
  const router = useRouter();

  if (!activity) return <div className="p-6 text-red-600">Activity not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => router.push('/explore')}
        className="mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-200 hover:text-purple-900 dark:hover:text-purple-100 font-medium text-lg px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition shadow-sm"
        aria-label="Back to activities"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to activities
      </button>
      <div className="rounded-2xl overflow-hidden shadow-xl mb-6">
        <Image src={unsplashUrl || activity.imageUrl || '/default-activity.jpg'} alt={activity.name} className="w-full h-64 object-cover object-center" width={600} height={256} />
      </div>
      <h1 className="text-3xl font-bold mb-2">{activity.name}</h1>
      {activity.address && (
        <div className="mb-2 text-gray-800 dark:text-gray-200 text-lg flex items-center gap-2">
          <span role="img" aria-label="Address">📍</span>
          <span>{activity.address}</span>
        </div>
      )}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1"><span role="img" aria-label="Price">💲</span>{activity.priceLevel}</div>
        <div className="flex items-center gap-1"><span role="img" aria-label="Activity Level">⚡</span>{activity.activityLevel}</div>
        <div className="flex items-center gap-1"><span role="img" aria-label="Duration">⏱️</span>{activity.duration} min</div>
      </div>
      {activity.description && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">About</h2>
          <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{activity.description}</p>
        </div>
      )}

      {activity.actionItems && activity.actionItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">How to Do This Activity</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
            {activity.actionItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {activity.website && (
        <a
          href={activity.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Visit Official Site
        </a>
      )}
      {activity.mapUrl && (
        <a
          href={activity.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
        >
          Open in Google Maps
        </a>
      )}
      {activity.directions && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Directions</h2>
          {typeof activity.directions === 'object' && activity.directions !== null ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
              {Object.values(activity.directions).map((val, idx) => (
                <li key={idx}>{typeof val === 'string' || typeof val === 'number' ? val : JSON.stringify(val)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{activity.directions}</p>
          )}
        </div>
      )}
      {activity.localTips && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Local Tips</h2>
          {typeof activity.localTips === 'object' && activity.localTips !== null ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
              {Object.values(activity.localTips).map((val, idx) => (
                <li key={idx}>{String(val)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{String(activity.localTips)}</p>
          )}
        </div>
      )}
      {activity.contextDetails && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Context</h2>
          {typeof activity.contextDetails === 'object' && activity.contextDetails !== null ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-200">
              {Object.values(activity.contextDetails).map((val, idx) => (
                <li key={idx}>{typeof val === 'string' || typeof val === 'number' ? val : JSON.stringify(val)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">{activity.contextDetails}</p>
          )}
        </div>
      )}
      <div className="mt-8">
        {openChat ? (
          <ActivityChat activityId={activity.id} onClose={() => setOpenChat(false)} />
        ) : (
          <button
            onClick={() => setOpenChat(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            Join Chat
          </button>
        )}
      </div>
    </div>
  );
}
