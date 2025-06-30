import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/profile';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('Auth check:', { user });
        
        if (!user) {
          if (mounted) {
            setError('Not logged in');
            setLoading(false);
          }
          return;
        }

        const targetId = userId || user.id;
        console.log('Loading profile for:', targetId);

        const { data, error } = await supabase
          .from('profile')
          .select()
          .eq('id', targetId)
          .single();
        
        console.log('Profile fetch:', { data, error });

        if (mounted) {
          if (error) {
            console.error('Profile error:', error);
            setError(error.message);
          } else {
            setProfile(data);
          }
          setLoading(false);
        }
      } catch (e: unknown) {
        console.error('Profile error:', e);
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e));
          setLoading(false);
        }
      }
    }
    
    loadProfile();
    return () => { mounted = false; };
  }, [userId]);

  const updateProfile = async (updates: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      
      const { error } = await supabase
        .from('profile')
        .update(updates as ProfileUpdate)
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  };

  return { profile, loading, error, updateProfile };
}
