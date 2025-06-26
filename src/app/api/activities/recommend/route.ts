import { NextResponse } from 'next/server';
import type { Activity, ActivityMatch, Location } from '@/types/activity';
import type { UserPreferences } from '@/types/preferences';
import { jsonrepair } from 'jsonrepair';
// OpenRouter config
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = 'mistralai/mistral-7b-instruct:free';

async function openRouterChat(messages: any[], temperature = 0.7, max_tokens = 700): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error('Missing OPENROUTER_API_KEY');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text}`);
  }
    const data = await res.json();
    if (!data.choices?.[0]?.message?.content) {
      console.error('OpenRouter raw response:', JSON.stringify(data, null, 2));
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

async function generateActivities(cacheKey: string, loc: Location): Promise<Activity[]> {
  // 24-hour cache
  const cached = activityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 86_400_000) {
    return cached.data;
  }
  if (!OPENROUTER_API_KEY) return mockActivities; // fallback if no key

  const systemMsg = 'You are a helpful travel guide that creates concise JSON.';
  const userMsg = `Return JSON with an array named \\"activities\\" (max 8 items). Each activity must include: id (string), name, description (<=120 chars), categories (array one or more of outdoor_adventure, food_drink, arts_culture, sports, wellness, nightlife), location { lat, lng } within 10 miles of (${loc.lat}, ${loc.lng}), priceLevel (free | low | medium | high), activityLevel (low | medium | high), duration (minutes, integer), bestTimes (array of morning | afternoon | evening | night), imageUrl (royalty-free Unsplash URL).
Respond ONLY the JSON.`;

  let rawContent = '';
  try {
    rawContent = await openRouterChat([
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ], 0.7, 700);
    const cleaned = jsonrepair(extractJson(rawContent));
    const parsed = JSON.parse(cleaned) as { activities: Activity[] };
    const acts = parsed.activities?.length ? parsed.activities : mockActivities;
    activityCache.set(cacheKey, { timestamp: Date.now(), data: acts });
    return acts;
  } catch (err) {
    console.error('Raw LLM output:', rawContent);
    console.error('Cleaned JSON attempt:', extractJson(rawContent));
    console.error('generateActivities LLM error:', (err as any)?.message);
    return mockActivities;
  }
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
  {
    id: '3',
    name: 'Art Museum Visit',
    description: 'Immerse yourself in contemporary and classical art with special exhibitions and guided tours available.',
    categories: ['arts_culture'],
    location: {
      lat: 39.7374,
      lng: -104.9656
    },
    priceLevel: 'low',
    activityLevel: 'low',
    duration: 120,
    bestTimes: ['morning', 'afternoon'],
    imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1000',
  },
  {
    id: '4',
    name: 'Rock Climbing Gym',
    description: 'Indoor climbing facility with routes for all skill levels, equipment rental, and beginner lessons.',
    categories: ['sports', 'outdoor_adventure'],
    location: {
      lat: 39.7559,
      lng: -104.9901
    },
    priceLevel: 'medium',
    activityLevel: 'high',
    duration: 120,
    bestTimes: ['morning', 'afternoon', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?q=80&w=1000',
  },
  {
    id: '5',
    name: 'Sunset Yoga in the Park',
    description: 'Outdoor yoga session suitable for all levels with amazing sunset views and peaceful atmosphere.',
    categories: ['wellness'],
    location: {
      lat: 39.7616,
      lng: -104.9622
    },
    priceLevel: 'low',
    activityLevel: 'medium',
    duration: 60,
    bestTimes: ['evening'],
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000',
  },
  {
    id: '6',
    name: 'Local Craft Brewery Tour',
    description: 'Visit multiple craft breweries, learn about the brewing process, and enjoy tastings of local beers.',
    categories: ['food_drink', 'nightlife'],
    location: {
      lat: 39.7599,
      lng: -104.9853
    },
    priceLevel: 'medium',
    activityLevel: 'low',
    duration: 180,
    bestTimes: ['afternoon', 'evening'],
    imageUrl: 'https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1000',
  }
];

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
  // Calculate scores and create matches
  const matches = activities.map(activity => {
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
    const { location } = await request.json();
    console.log('Received location:', location);
    
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
    const actCacheKey = `${Math.round(location.lat * 100) / 100},${Math.round(location.lng * 100) / 100}`;
    const activities = await generateActivities(actCacheKey, location);

    const quickMatches = getRecommendations(userPreferences, location, activities);

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
      return NextResponse.json(quickMatches);
    }

    // Build AI prompt with top 10 quick matches
    const topActivities = quickMatches.slice(0, 10).map(m => m.activity);
    const prompt = `You are a travel activity recommender. Rank the following activities for the user. Respond ONLY with JSON matching this schema: {\n  \"recommendations\": [ { \"activityId\": string, \"score\": number, \"reasons\": string[] } ]\n}.\nUser preferences: ${JSON.stringify(userPreferences)}\nActivities: ${JSON.stringify(topActivities)}`;

    try {
      const rawContent = await openRouterChat([
        { role: 'user', content: prompt }
      ], 0.2, 400);
      const cleaned = jsonrepair(extractJson(rawContent));
      const parsed = JSON.parse(cleaned) as { recommendations: { activityId: string; score: number; reasons: string[] }[] };
      const aiMatches: ActivityMatch[] = parsed.recommendations.map(r => ({
        activity: activities.find(a => a.id === r.activityId) ?? topActivities[0],
        score: r.score,
        matchReasons: r.reasons,
      }));
      aiCache.set(cacheKey, { timestamp: Date.now(), data: aiMatches });
      return NextResponse.json(aiMatches);
    } catch (err: any) {
      console.error('OpenRouter error, falling back to quick matches:', err?.message);
      return NextResponse.json(quickMatches);
    }
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}
