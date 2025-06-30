"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ProfileForm } from '@/components/profile/profile-form';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Profile page auth check:', user);
      
      if (!user) {
        router.push('/login');
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Loading profile...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <ProfileForm />
    </div>
  );
}
