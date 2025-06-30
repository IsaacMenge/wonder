import { NextResponse } from 'next/server';
import type { UserPreferences } from '@/types/preferences';

// TODO: Replace with actual database
const userPreferences: Record<string, UserPreferences> = {};

export async function POST(request: Request) {
  const userId = 'user123'; // TODO: Get from auth
  const preferences: UserPreferences = await request.json();
  
  userPreferences[userId] = preferences;
  
  return NextResponse.json({ success: true });
}

export async function GET() {
  const userId = 'user123'; // TODO: Get from auth
  
  return NextResponse.json(userPreferences[userId] || null);
}
