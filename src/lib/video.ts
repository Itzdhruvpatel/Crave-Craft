import type { Cuisine, Dish } from './types.ts';

// Trusted, real cooking channels. Until a dish has a fixed video id, YouTube search is limited to dish name + channel.
const CHANNEL: Partial<Record<Cuisine, string>> = {
  gujarati: 'Hebbars Kitchen',
  punjabi: 'Ranveer Brar',
  south: 'Hebbars Kitchen',
  maharashtrian: 'Madhuras Recipe',
  street: 'Ranveer Brar',
};

export function videoUrl(d: Dish): string {
  if (d.video) return `https://www.youtube.com/watch?v=${d.video}`;
  const q = `${d.name.en} recipe ${CHANNEL[d.cuisine] ?? 'Nisha Madhulika'}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
