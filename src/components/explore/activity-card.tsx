'use client';

import type { ActivityMatch } from '@/types/activity';
import { useActivityInterest } from '@/hooks/useActivityInterest';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useUnsplashImage } from '@/hooks/useUnsplashImage';
import Image from 'next/image';
const ActivityChat = dynamic(() => import('./activity-chat'), { ssr: false });

interface ActivityCardProps {
  match: ActivityMatch;
}

export function ActivityCard({ match }: ActivityCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const router = useRouter();
  const { activity, score, matchReasons } = match;
  const { users, loading: saving, toggleInterest } = useActivityInterest(activity.id);
  const [cooldown, setCooldown] = useState(false);
  const loading = saving || cooldown;
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
          <Image
            src={unsplashUrl || activity.imageUrl || '/default-activity.jpg'}
            alt={activity.name}
            className="w-full h-full object-cover object-center transition-all duration-300"
            width={600}
            height={256}
            style={{ minHeight: 180 }}
          />
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold">{activity.name}</h3>
          <span className="inline-flex items-center bg-gradient-to-r from-purple-400/80 to-purple-600/90 dark:from-purple-900 dark:to-purple-700 shadow-lg text-white px-3 py-1.5 rounded-2xl text-base font-bold tracking-tight border-2 border-white dark:border-purple-900 -mt-2 mr-1">
            {Math.round(score)}% Match
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {activity.description}
        </p>
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex flex-col gap-2 items-center mb-2">
            <button
              onClick={() => {
                if (cooldown) return;
                setCooldown(true);
                setTimeout(() => setCooldown(false), 500);
                router.push(`/activity/${activity.id}`);
                toggleInterest().catch(() => {});
              }}
              disabled={loading}
              className={`px-4 py-2 rounded-full border border-purple-300 dark:border-purple-700 text-sm font-medium bg-transparent text-purple-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition disabled:opacity-50 w-44`}
            >
              {loading ? 'Saving…' : joined ? `Joined (${users.length})` : "I'm Interested"}
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-medium bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition w-44"
            >
              Chat
            </button>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
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
