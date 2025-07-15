import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jsonrepair } from 'jsonrepair';
import type { Activity } from '@/types/activity';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Helper to generate Google Maps link
function getMapUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// LLM augmentation for activity details
async function getLLMDetails(activity: Activity): Promise<Partial<Activity>> {
  if (!OPENROUTER_API_KEY) return {};
  const systemMsg = `You are a helpful local expert and travel assistant.`;
  const userMsg = `Given the following activity, provide (1) step-by-step directions for a visitor, (2) 2-3 local tips, and (3) a short paragraph of rich context (history, what to bring, accessibility, etc).\n\nActivity: ${activity.name}\nDescription: ${activity.description}\nLocation: lat ${activity.location.lat}, lng ${activity.location.lng}`;
  const prompt = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: userMsg }
  ];
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.2-24b-instruct:free',
        messages: prompt,
        temperature: 0.5,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    // Expecting JSON: { directions: string, localTips: string, contextDetails: string }
    const repaired = jsonrepair(content);
    const parsed = JSON.parse(repaired);
    return parsed;
  } catch (err) {
    console.error('LLM detail error:', err);
    return {};
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const { data, error } = await supabase.from('activity').select('*').eq('id', id).single();
  if (error || !data) {
    console.error('Supabase error or no data:', error, data);
    return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
  }

  console.log('Supabase activity data:', data);

  // Defensive: check location shape
  let lat: number | undefined, lng: number | undefined;
  if (data.location && typeof data.location === 'object') {
    if ('lat' in data.location && 'lng' in data.location) {
      lat = data.location.lat;
      lng = data.location.lng;
    } else if (Array.isArray(data.location) && data.location.length === 2) {
      lat = data.location[0];
      lng = data.location[1];
    }
  }
  if (!lat || !lng) {
    console.error('Malformed or missing location for activity:', data);
    return NextResponse.json({ error: 'Activity location missing or malformed', data }, { status: 400 });
  }

  // Generate mapUrl if not present
  if (!data.mapUrl) {
    data.mapUrl = getMapUrl(lat, lng);
  }
  // Patch location to correct shape for downstream
  data.location = { lat, lng };

  // If any detail fields missing, augment with LLM
  if (!data.directions || !data.localTips || !data.contextDetails) {
    const llmDetails = await getLLMDetails(data);
    data.directions = data.directions || llmDetails.directions;
    data.localTips = data.localTips || llmDetails.localTips;
    data.contextDetails = data.contextDetails || llmDetails.contextDetails;
  }

  // Map backend fields to frontend Activity type
  const result = {
    ...data,
    address: data.address || '',
    actionItems: Array.isArray(data.action_items) ? data.action_items : (data.action_items ? JSON.parse(data.action_items) : []),
    categories: Array.isArray(data.categories) ? data.categories : (data.categories ? JSON.parse(data.categories) : []),
  };

  console.log('Returning mapped activity detail:', result);
  return NextResponse.json(result);
}
