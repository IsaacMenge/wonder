import { useEffect, useState } from 'react';

const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_KEY;

export function useUnsplashImage(query: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchImage() {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`
        );
        const data = await res.json();
        if (!cancelled && data && data.urls && data.urls.regular) {
          setUrl(data.urls.regular);
        } else if (!cancelled) {
          setUrl(null);
        }
      } catch {
        if (!cancelled) setUrl(null);
      }
      setLoading(false);
    }
    if (UNSPLASH_ACCESS_KEY) fetchImage();
    else setLoading(false);
    return () => { cancelled = true; };
  }, [query]);

  return { url, loading };
}
