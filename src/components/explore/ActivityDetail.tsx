"use client";
import { useEffect, useState } from 'react';
import { useUnsplashImage } from '@/hooks/useUnsplashImage';
import ActivityChat from './activity-chat';
import { supabase } from '@/lib/supabase';
import type { Activity } from '@/types/activity';

interface ActivityDetailProps {
  activityId: string;
}

export default function ActivityDetail({ activityId }: ActivityDetailProps) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [openChat, setOpenChat] = useState(false);
  const { url: unsplashUrl } = useUnsplashImage(activity?.name || '');

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true);
      const { data } = await supabase
        .from('activity')
        .select('*')
        .eq('id', activityId)
        .single();
      setActivity(data);
      setLoading(false);
    }
    fetchActivity();
  }, [activityId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!activity) return <div className="p-6 text-red-600">Activity not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-2xl overflow-hidden shadow-xl mb-6">
        <img src={unsplashUrl || activity.imageUrl || '/default-activity.jpg'} alt={activity.name} className="w-full h-64 object-cover object-center" />
      </div>
      <h1 className="text-3xl font-bold mb-2">{activity.name}</h1>
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
      <p className="text-lg text-gray-700 dark:text-gray-200 mb-6">{activity.description}</p>

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
