// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // This injects/refreshes the Supabase session cookie
  const supabase = createMiddlewareClient<Database>({ req, res });
  await supabase.auth.getSession();

  return res;
}

// Run on every route (change the matcher if you want to limit it)
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};