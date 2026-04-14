export async function geocodeAddress(
  address: string,
  city: string = 'Guadalajara',
  apiKey: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
): Promise<{ lat: number; lng: number } | null> {
  const key = String(apiKey ?? '').trim();
  if (!key) return null;
  const full = `${address}, ${city}, Jalisco, Mexico`.trim();
  const fullAddress = encodeURIComponent(full);
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${fullAddress}&key=${key}`;

  try {
    const res = await fetch(url);
    const data = (await res.json()) as any;
    if (data?.status === 'OK' && data?.results?.[0]) {
      const loc = data.results[0]?.geometry?.location;
      const lat = Number(loc?.lat);
      const lng = Number(loc?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
    }
    return null;
  } catch (e) {
    console.error('Geocoding failed:', e);
    return null;
  }
}

