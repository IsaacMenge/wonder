"use client";
import { useEffect, useRef } from "react";
import Image from 'next/image';
import Link from 'next/link';

const activities = [
  {
    city: "Tokyo",
    activity: "Shibuya Nightlife",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Paris",
    activity: "Eiffel Tower Picnic",
    image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Cape Town",
    activity: "Table Mountain Hike",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "New York",
    activity: "Central Park Rowboats",
    image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Sydney",
    activity: "Sydney Opera House Tour",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80",
  },
  {
    city: "Rio de Janeiro",
    activity: "Copacabana Beach Volleyball",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
  },
];

export function GlobalActivityGallery() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = Array.from(gridRef.current.querySelectorAll('.pop-card'));
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.2 }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-purple-50/60 to-white dark:from-gray-900 dark:to-gray-950">
      <h2 className="text-3xl sm:text-4xl font-bold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
        Wonder Around the World
      </h2>
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto"
      >
        {activities.map((a, i) => (
          <Link
            href="/explore"
            key={a.city}
            className="pop-card opacity-0 translate-y-8 transition-all duration-700 ease-out rounded-3xl overflow-hidden shadow-2xl relative group cursor-pointer focus:ring-4 focus:ring-purple-200"
            style={{ transitionDelay: `${i * 120}ms` }}
            tabIndex={0}
            aria-label={`Start exploring activities like ${a.activity} in ${a.city}`}
          >
            <Image
              src={a.image}
              alt={`${a.activity} in ${a.city}`}
              width={600}
              height={256}
              className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-500 blur-0"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col items-start">
              <span className="text-white text-lg font-semibold drop-shadow-md">
                {a.activity}
              </span>
              <span className="text-purple-200 text-base font-medium drop-shadow-md">
                {a.city}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
