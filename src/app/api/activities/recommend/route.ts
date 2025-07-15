import { NextResponse } from 'next/server';
import type { Activity, ActivityMatch, Location } from '@/types/activity';
import type { UserPreferences } from '@/types/preferences';
import { jsonrepair } from 'jsonrepair';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log('OPENROUTER_API_KEY present:', !!OPENROUTER_API_KEY);


// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

type OpenRouterMessage = { role: 'system' | 'user' | 'assistant'; content: string };

async function openRouterChat(messages: OpenRouterMessage[], temperature = 0.7, max_tokens = 700, model = 'google/gemma-7b-it:free'): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('Missing OPENROUTER_API_KEY');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('OpenRouter API error. Status:', res.status, 'Body:', text);
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }
  const data = await res.json();
  console.log('OpenRouter API response:', JSON.stringify(data, null, 2));
  if (!data.choices?.[0]?.message?.content) {
    console.error('OpenRouter raw response (no content):', JSON.stringify(data, null, 2));
    throw new Error(data.error?.message || 'No choices in response');
  }
  return data.choices[0].message.content as string;
}

function extractJson(raw: string): string {
  let txt = raw.trim();
  if (txt.startsWith('```')) {
    // remove initial ``` and language if present
    txt = txt.replace(/^```[a-zA-Z0-9]*\n/, '');
    // remove trailing ```
    if (txt.endsWith('```')) {
      txt = txt.slice(0, -3);
    }
  }
  // extract JSON object
  const firstBrace = txt.indexOf('{');
  const lastBrace = txt.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    txt = txt.slice(firstBrace, lastBrace + 1);
  }
  // remove trailing commas before closing brackets/braces
  txt = txt.replace(/,\s*[}\]]/g, match => match.trim().slice(-1));
  return txt.trim();
}

// Simple in-memory cache for AI results (1-hour TTL)
const aiCache: Map<string, { timestamp: number; data: ActivityMatch[] }> = new Map();

// Cache for GPT-generated activities per location (24-hour TTL)
const activityCache: Map<string, { timestamp: number; data: Activity[] }> = new Map();

// Timeout helper for OpenRouter calls
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('OpenRouter timeout')), ms))
  ]);
}

// Mock activities database
const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Mountain Trail Hike',
    description: 'A beautiful 3-mile hiking trail with scenic mountain views. Perfect for nature enthusiasts and photographers.',
    categories: ['outdoor_adventure'],
    location: {
      lat: 39.7392,
      lng: -104.9903
    },
    priceLevel: 'free',
    activityLevel: 'high',
    duration: 180,
    bestTimes: ['morning', 'afternoon'],
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000',
  },
  {
    id: '2',
    name: 'Downtown Food Tour',
    description: 'Explore local cuisine with this guided food tour featuring 5 unique restaurants and cultural insights.',
    categories: ['food_drink', 'local_experiences'],
    location: {
      lat: 39.7456,
      lng: -104.9989
    },
    priceLevel: 'medium',
    activityLevel: 'low',
    duration: 180,
    bestTimes: ['afternoon', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000',
  },
  // ... (rest of mockActivities)
];

async function generateActivities(cacheKey: string, loc: Location, userPreferences: UserPreferences, userQuery?: string): Promise<Activity[]> {
  // 24-hour cache
  // Include userQuery in cache key to avoid stale results
  const cached = activityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 86_400_000) {
    console.log('Returning activities from cache:', cached.data);
    return cached.data;
  }
  if (!OPENROUTER_API_KEY) {
    console.log('No OPENROUTER_API_KEY, returning mockActivities');
    return mockActivities;
  }

  const systemMsg = `You are a local activity expert and JSON API.`;
// Model is now passed directly to openRouterChat; this variable is not needed.

  const userMsg = `Suggest at least 5 hyper-specific, actionable, and real activities for a user at the given latitude/longitude. Each activity must:
- Reference a real, verifiable venue, event, or landmark in the target city (never generic or made-up places)
- Include the full street address, city, and country
- Be feasible for a visitor or local (no generic advice)
- Include a detailed, actionable description (2-3 sentences: why it's worth doing and how to do it)
- Provide at least 2 actionable steps or tips (e.g., 'Reserve a table online', 'Arrive before 6pm for happy hour', 'Ask for the rooftop seating')
- Use the local language and currency if appropriate
- If the city is outside the US, avoid US-centric suggestions; use local context, customs, and venues
- If the city or location is not valid or no such activities exist, return an empty array
- Each activity must be different from the others. Do not repeat names or locations.

${userQuery && userQuery.trim() ? `IMPORTANT: The user specifically requested: ${userQuery.trim()}.
You MUST ONLY suggest activities that directly match this request. Do not include any activities that do not clearly fit the user's request. If no activities fit, return an empty array.` : ''}

Respond ONLY with a single valid JSON array, and nothing else. Do NOT include any prose, comments, or text before or after the JSON. Do NOT use trailing commas. Do NOT include markdown code fences.

Format: [ { id, name, description, categories, location: { lat, lng }, address, actionItems } ]

User location: ${loc.lat}, ${loc.lng}
User preferences: ${JSON.stringify(userPreferences)}
`;


  let rawContent = '';
  try {
    rawContent = await withTimeout(
      openRouterChat([
        { role: 'system', content: systemMsg },
        { role: 'user', content: userMsg }
      ], 0.2, 900, 'mistralai/mistral-small-3.2-24b-instruct:free'),
      20000 // 20 second timeout
    );
    console.log('Raw LLM output:', rawContent);
    const cleaned = extractJson(rawContent);
    const repaired = jsonrepair(cleaned);
    console.log('Cleaned JSON:', cleaned);
    console.log('Repaired JSON:', repaired);
    const parsed = JSON.parse(repaired);
    const acts = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.activities)
        ? parsed.activities
        : [];
    // Ensure each activity has an address field (even if undefined)
    const actsWithAddress = acts.map((a: Activity) => ({
      ...a,
      address: a.address || undefined,
      actionItems: a.actionItems || []
    }));
    if (!Array.isArray(actsWithAddress) || actsWithAddress.length === 0) throw new Error('No activities returned');

    // --- AUTOMATICALLY UPSERT TO SUPABASE ---
    const validActs: Activity[] = [];
    for (const activity of actsWithAddress) {
      // Robust logging of raw activity from LLM
      console.log('Raw LLM activity:', JSON.stringify(activity, null, 2));
      // Stricter checks: location must be object with lat/lng, address must be non-empty string, actionItems must be array
      const hasValidLocation = activity.location && typeof activity.location.lat === 'number' && typeof activity.location.lng === 'number';
      const hasValidAddress = typeof activity.address === 'string' && activity.address.trim().length > 0;
      const hasValidActionItems = Array.isArray(activity.actionItems) && activity.actionItems.length > 0;
      if (hasValidLocation && hasValidAddress && hasValidActionItems) {
        validActs.push(activity);
        // Ensure id is a valid UUID
        const upsertId = validateUuid(activity.id) ? activity.id : uuidv4();
        // Update the activity object so the UUID propagates to the frontend / cache
        activity.id = upsertId as unknown as never;
        // Only include valid Supabase columns in the upsert object
        const upsertObj = {
          id: upsertId,
          name: activity.name,
          description: activity.description,
          categories: `{${activity.categories.join(',')}}`,
          location: activity.location,
          address: activity.address,
          action_items: activity.actionItems // assumes column action_items jsonb exists
        };
        console.log('Upserting activity to Supabase with id:', upsertId, JSON.stringify(upsertObj, null, 2));
        try {
          const { data: upsertData, error: upsertError } = await supabase
            .from('activity')
            .upsert([upsertObj], { onConflict: 'id' })
            .select();
          if (upsertError) {
            console.error('Supabase upsert error:', upsertError);
          } else {
            console.log('Supabase upsert result:', JSON.stringify(upsertData, null, 2));
          }
        } catch (e) {
          console.error('Error upserting activity to Supabase:', upsertObj, e);
        }
      } else {
        console.warn('Skipping upsert for activity due to invalid fields:', {
          location: activity.location,
          address: activity.address,
          actionItems: activity.actionItems
        });
      }
    }
    // --- END UPSERT ---

    activityCache.set(cacheKey, { timestamp: Date.now(), data: validActs });
    console.log('Returning filtered valid activities from LLM:', validActs);
    return validActs;
  } catch (err: unknown) {
    console.error('Raw LLM output (error):', rawContent);
    console.error('Cleaned JSON attempt (error):', extractJson(rawContent));
    console.error('generateActivities LLM error:', err instanceof Error ? err.message : String(err), err);
    const fallback = mockActivities.map(a => ({...a, _llmFallback: true, _llmError: err instanceof Error ? err.message : String(err)}));
    console.log('generateActivities LLM error, returning mockActivities with fallback reason:', fallback);
    return fallback;
  }
}

function calculateScore(activity: Activity, userPreferences: UserPreferences, distance: number): {score: number; reasons: string[]} {
  const reasons: string[] = [];
  let score = 50; // Base score

  // Distance score (up to 30 points)
  const distanceScore = Math.max(0, 30 - (distance * 3));
  score += distanceScore;
  if (distance <= 5) {
    reasons.push('Very close to your location');
  } else if (distance <= 10) {
    reasons.push('Within reasonable distance');
  }

  // Category match (up to 40 points)
  activity.categories.forEach(category => {
    const interest = userPreferences.categories[category];
    if (interest === 'very_interested') {
      score += 20;
      reasons.push(`Matches your strong interest in ${category.replace('_', ' ')}`);
    } else if (interest === 'somewhat_interested') {
      score += 10;
      reasons.push(`Aligns with your interest in ${category.replace('_', ' ')}`);
    }
  });

  // Activity level match (up to 20 points)
  if (activity.activityLevel === userPreferences.activityLevel) {
    score += 20;
    reasons.push(`Matches your preferred activity level: ${activity.activityLevel}`);
  } else if (
    (userPreferences.activityLevel === 'medium' && activity.activityLevel !== 'high') ||
    (userPreferences.activityLevel === 'low' && activity.activityLevel === 'low')
  ) {
    score += 10;
    reasons.push('Activity level is manageable for you');
  }

  // Price match (up to 10 points)
  if (
    (userPreferences.budget === 'budget' && activity.priceLevel === 'free') ||
    (userPreferences.budget === 'moderate' && ['free', 'low', 'medium'].includes(activity.priceLevel)) ||
    (userPreferences.budget === 'luxury')
  ) {
    score += 10;
    reasons.push('Fits within your budget');
  }

  // Normalize score to 0-100
  score = Math.min(100, Math.max(0, score));

  return { score, reasons };
}


function getRecommendations(
  userPreferences: UserPreferences,
  userLocation: Location,
  activities: Activity[]
): ActivityMatch[] {
  // Calculate scores and create matches, skip activities with missing location
  const matches = activities
    .filter(activity => activity.location && typeof activity.location.lat === 'number' && typeof activity.location.lng === 'number')
    .map(activity => {
      const distance = calculateDistance(userLocation, activity.location);
      const { score, reasons } = calculateScore(activity, userPreferences, distance);
      return {
        activity,
        score,
        matchReasons: reasons
      };
    });

  // Sort by score descending
  return matches.sort((a, b) => b.score - a.score);
}

function calculateDistance(loc1: Location, loc2: Location): number {
  // Simple distance calculation using Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  const lat1 = toRad(loc1.lat);
  const lat2 = toRad(loc2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI/180);
}

export async function POST(request: Request) {
  try {
    const { location, query } = await request.json();
    console.log('Received location:', location, 'User query:', query);
    
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid location:', location);
      return NextResponse.json(
        { error: 'Invalid location format' },
        { status: 400 }
      );
    }

    // Mock user preferences (TODO: Get from database)
    const userPreferences = {
      categories: {
        outdoor_adventure: 'very_interested',
        food_drink: 'somewhat_interested',
        arts_culture: 'somewhat_interested',
        sports: 'very_interested',
        wellness: 'somewhat_interested',
        nightlife: 'somewhat_interested'
      },
      budget: 'moderate',
      activityLevel: 'medium',
      preferredTime: ['morning', 'afternoon'],
      travelDistance: 10
    } as UserPreferences;

    console.log('Using preferences:', userPreferences);

    // Generate or retrieve activities for this location
    const actCacheKey = `${Math.round(location.lat * 100) / 100},${Math.round(location.lng * 100) / 100},query:${(query || '').toLowerCase().trim()}`;
    const activities = await generateActivities(actCacheKey, location, userPreferences, query);
console.log('activities input:', JSON.stringify(activities, null, 2));

    const matches = getRecommendations(userPreferences, location, activities);
console.log('matches from getRecommendations:', JSON.stringify(matches, null, 2));

    // Cache key based on prefs + rounded location (0.01 deg)
    const cacheKey = JSON.stringify({
      prefs: userPreferences,
      lat: Math.round(location.lat * 100) / 100,
      lng: Math.round(location.lng * 100) / 100,
    });

    // 1-hour cache
    const cached = aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600_000) {
      return NextResponse.json(cached.data);
    }

    // If no OpenRouter, return quick matches directly
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(matches);
    }

    // Build a highly specific prompt for the LLM rerank step
    const topActivities = matches.slice(0, 10).map(m => m.activity);
    const prompt = `You are a travel activity recommender. Your job is to suggest unique, local activities that fit the user's preferences and current location. Avoid generic or touristy suggestions. Each activity should be tailored to the user's interests, budget, activity level, and time of day. Respond ONLY with valid JSON as described.\n\nUser location: ${location.lat}, ${location.lng}\nUser preferences:\n- Categories: ${JSON.stringify(userPreferences.categories)}\n- Budget: ${userPreferences.budget}\n- Activity Level: ${userPreferences.activityLevel}\n- Preferred Time: ${JSON.stringify(userPreferences.preferredTime)}\n- Max Travel Distance: ${userPreferences.travelDistance} miles\n${query && query.trim() ? `\nThe user specifically requested: ${query.trim()}` : ''}\n\nHere are some candidate activities nearby:\n${JSON.stringify(topActivities, null, 2)}\n\nRank the activities in order of best fit for this user. For each, explain specifically WHY it matches the user's interests, location, and request. Avoid repeating generic reasons. If none are a good fit, say so.\n\nRespond ONLY with JSON matching this schema:\n{\n  \"recommendations\": [\n    { \"activityId\": string, \"score\": number, \"reasons\": string[] }\n  ]\n}`;

    // Timeout helper
    async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('OpenRouter rerank timeout')), ms))
      ]);
    }

    try {
      const rawContent = await withTimeout(
        openRouterChat([
          { role: 'system', content: prompt }
        ], 0.2, 250),
        7000 // 7 second timeout
      );
      const cleaned = jsonrepair(extractJson(rawContent));
      const parsed = JSON.parse(cleaned) as { recommendations: { activityId: string; score: number; reasons: string[] }[] };
      const aiMatches: ActivityMatch[] = parsed.recommendations.map(r => ({
        activity: activities.find(a => a.id === r.activityId) ?? topActivities[0],
        score: r.score,
        matchReasons: r.reasons,
      }));
      aiCache.set(cacheKey, { timestamp: Date.now(), data: aiMatches });
      return NextResponse.json(aiMatches);
    } catch (err) {
      console.error('OpenRouter rerank error or timeout, falling back to quick matches:', err instanceof Error ? err.message : String(err));
      return NextResponse.json(matches);
    }
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations', details: error?.toString() },
      { status: 500 }
    );
  }
}

