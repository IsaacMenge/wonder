import { NextResponse } from 'next/server';

interface GeocodeRequest {
  city: string;
  state: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function POST(request: Request) {
  try {
    const { city, state } = (await request.json()) as GeocodeRequest;

    if (!city || !state) {
      return NextResponse.json({ error: 'City and state are required' }, { status: 400 });
    }

    const query = encodeURIComponent(`${city}, ${state}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a valid User-Agent
        'User-Agent': 'wonder-travel-app/1.0 (contact: example@example.com)'
      }
    });

    if (!res.ok) {
      console.error('Nominatim error:', res.status, await res.text());
      return NextResponse.json({ error: 'Failed to geocode location' }, { status: 502 });
    }

    const data = (await res.json()) as NominatimResult[];
    if (!data.length) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const { lat, lon } = data[0];
    return NextResponse.json({ lat: parseFloat(lat), lng: parseFloat(lon) });
  } catch (error) {
    console.error('Geocode error:', error);
    return NextResponse.json({ error: 'Failed to geocode location' }, { status: 500 });
  }
}
