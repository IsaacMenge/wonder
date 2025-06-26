import { createBrowserClient } from '@supabase/ssr';

// Singleton Supabase browser client for use in React components
// Requires SUPABASE_URL and SUPABASE_ANON_KEY to be set in .env.local

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  {
    auth: {
      // Persist session in localStorage for SPA navigation
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
