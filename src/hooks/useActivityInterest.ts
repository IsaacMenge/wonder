import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useActivityInterest(activityId: string) {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!activityId) return;
    const { data, error } = await supabase
      .from('activity_interest')
      .select('user_id')
      .eq('activity_id', activityId);
    if (error) {
      setError(error.message);
    } else {
      setUsers(data?.map((d) => d.user_id) || []);
    }
  }, [activityId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleInterest = async () => {
    setLoading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not logged in');
      const { error } = await supabase.from('activity_interest').upsert({
        user_id: userId,
        activity_id: activityId,
      });
      if (error) throw error;
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return { users, loading, error, toggleInterest };
}
