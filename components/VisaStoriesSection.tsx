"use client";

import { useEffect, useState } from "react";

type Story = { id: string; country: string; countryFlag: string | null; headline: string; body: string | null; customerName: string | null };

export default function VisaStoriesSection() {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetch("/api/visa-stories").then(r => r.json()).then(d => setStories(d.stories ?? [])).catch(() => {});
  }, []);

  if (!stories.length) return null;

  return (
    <section className="py-16 px-6" style={{ background: "var(--lp-ivory)" }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-[var(--lp-brass)] font-semibold tracking-widest text-xs uppercase mb-3 text-center">Happy Travellers</p>
        <h2 className="font-display text-3xl font-semibold mb-10 text-center">
          Visa <span className="italic text-[var(--lp-brass)]">Success Stories</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none">{s.countryFlag || "🌍"}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{s.country}</p>
                </div>
              </div>
              <p className="font-semibold text-[var(--lp-ink)] text-base leading-snug">{s.headline}</p>
              {s.body && <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>}
              {s.customerName && (
                <p className="text-xs text-gray-400 italic mt-auto pt-2 border-t border-gray-100">— {s.customerName}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
