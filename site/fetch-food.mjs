// Copies a few Wikimedia Commons dish photos into public/food for the 3D thali.
// Usage: node fetch-food.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const FILES = {
  dal: 'Gujarati_daal.jpg',
  sabji: 'Sev_Tameta_Nu_Shaak.jpg',
  rotli: 'Chapati_1.jpg',
  rice: 'Jeera_Rice_(only).jpg',
  salad: 'Kachumber_Salad.JPG',
  undhiyu: 'Undhiyu.jpg',
  khaman: 'SPECIAL_SURATI_KHAMAN.jpg',
  shrikhand: 'Shrikhand.JPG',
};

mkdirSync('public/food', { recursive: true });
for (const [name, file] of Object.entries(FILES)) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=640`;
  const res = await fetch(url, { headers: { 'User-Agent': 'dish-photo-finder/1.0' } });
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  writeFileSync(`public/food/${name}.jpg`, Buffer.from(await res.arrayBuffer()));
  console.log(name, res.headers.get('content-length'));
  await new Promise((r) => setTimeout(r, 1500));
}
