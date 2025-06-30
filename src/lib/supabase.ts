import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Singleton Supabase browser client for use in React components
// Requires SUPABASE_URL and SUPABASE_ANON_KEY to be set in .env.local

export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  options: {
    realtime: {
      params: {
        eventsPerSecond: 10 // Lower if you get rate limit errors
      },
    },
  },
});
