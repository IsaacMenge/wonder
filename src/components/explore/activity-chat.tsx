"use client";

import { useEffect, useRef, useState } from 'react';
import { supabase } from "@/lib/supabase";

interface ActivityChatProps {
  activityId: string;
  onClose: () => void;
}

interface Message {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
}

interface Profile {
  username: string;
  full_name: string | null;
}

export default function ActivityChat({ activityId, onClose }: ActivityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // initial fetch
  useEffect(() => {
    const fetchMsgs = async () => {
      // Fetch messages
      const msgResult = await supabase
        .from("message")
        .select("id,user_id,content,created_at")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });
      
      if (!msgResult.error && msgResult.data) {
        setMessages(msgResult.data as Message[]);
        
        // Fetch profiles for all unique user_ids
        const userIds = [...new Set(msgResult.data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profile')
          .select('id,username,full_name')
          .in('id', userIds);
        
        if (profiles) {
          const profileMap = Object.fromEntries(
            profiles.map(p => [p.id, p])
          );
          setProfiles(profileMap);
        }
      }
    };
    fetchMsgs();
  }, [activityId]);

  // subscribe to realtime
  useEffect(() => {
    const channel = supabase
      .channel("messages-" + activityId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message", filter: `activity_id=eq.${activityId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    setSendError(null);
    if (!input.trim()) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('Send: user', userData, 'input', input);
    if (userError) {
      setSendError(userError.message);
      return;
    }
    const userId = userData.user?.id;
    if (!userId) {
      setSendError('Not logged in');
      return;
    }
    const { data, error } = await supabase
      .from("message")
      .insert({ activity_id: activityId, user_id: userId, content: input.trim() })
      .select()
      .single();
    if (error) {
      setSendError(error.message);
      console.error('Send error:', error);
    } else if (data) {
      setInput("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md h-[80vh] rounded-lg shadow-lg flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="font-semibold">Activity Chat</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => {
            const profile = profiles[m.user_id];
            return (
              <div key={m.id + '-' + m.user_id + '-' + m.created_at} className="text-sm">
                <span className="font-medium mr-1">{profile?.username || m.user_id.slice(0, 6)}:</span>
                {m.content}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {sendError && (
            <div className="text-red-600 text-xs mb-1">{sendError}</div>
          )}
          <input
            className="flex-1 border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message"
          />
          <button
            onClick={send}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50 text-sm"
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
