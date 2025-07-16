import { NextResponse } from 'next/server';

interface GeocodeRequest {
  city: string;
  state?: string;
  isInternational?: boolean;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function POST(request: Request) {
  try {
    const { city, state, isInternational } = (await request.json()) as GeocodeRequest;

    if (!city || (!isInternational && !state)) {
      return NextResponse.json({ error: isInternational ? 'City is required' : 'City and state are required' }, { status: 400 });
    }

    // If US state abbreviation provided, expand to full name for better geocode accuracy
    const usStates: Record<string, string> = {
      AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
    };
    const stateQuery = state && state.length === 2 ? usStates[state.toUpperCase()] || state : state;

    const query = isInternational ? encodeURIComponent(city) : encodeURIComponent(`${city}, ${stateQuery}`);
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
