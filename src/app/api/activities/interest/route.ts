import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

// Helper to get a Supabase client bound to the current cookie session
function getClient() {
  return createRouteHandlerClient<Database>({ cookies });
}

// POST /api/activities/interest  body: { activityId: string }
export async function POST(request: Request) {
  const supabase = getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { activityId } = await request.json();
  if (!activityId) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

  const { error } = await supabase.from('activity_interest').upsert({
    user_id: user.id,
    activity_id: activityId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ status: 'ok' });
}

// GET /api/activities/interest?activityId=...
export async function GET(request: Request) {
  const supabase = getClient();
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId');
  if (!activityId) return NextResponse.json({ error: 'Missing activityId' }, { status: 400 });

  const { data, error } = await supabase
    .from('activity_interest')
    .select('user_id')
    .eq('activity_id', activityId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data?.map((d) => d.user_id) || [] });
}
