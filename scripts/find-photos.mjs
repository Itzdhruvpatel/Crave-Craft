// Finds free-licence dish photos on Wikimedia Commons and writes candidates for review.
// Usage: node scripts/find-photos.mjs <out.json>
// Review the candidates, then copy the chosen ones into src/data/photos.ts.
import { writeFileSync } from 'node:fs';

import { DISHES } from '../src/data/dishes/index.ts';

const API = 'https://commons.wikimedia.org/w/api.php';
const ALLOWED = /^(cc0|cc[- ]by(-sa)?[- ]?[0-9.]*|public domain|pd)/i;

async function search(q) {
  const url = new URL(API);
  Object.entries({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '8',
    gsrsearch: `${q} filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '640',
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  let json;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'dish-photo-finder/1.0' } });
    const body = await res.text();
    try {
      json = JSON.parse(body);
      break;
    } catch {
      if (attempt >= 6) throw new Error(`Commons keeps refusing: ${body.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
    }
  }
  return Object.values(json.query?.pages ?? {})
    .sort((a, b) => a.index - b.index)
    .map((p) => {
      const ii = p.imageinfo?.[0];
      const m = ii?.extmetadata ?? {};
      return {
        title: p.title,
        thumb: ii?.thumburl,
        page: ii?.descriptionurl,
        license: m.LicenseShortName?.value ?? '',
        author: (m.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim(),
        w: ii?.width,
        h: ii?.height,
      };
    })
    .filter((c) => c.thumb && ALLOWED.test(c.license) && c.w >= 500);
}

// Commons knows many dishes by their Hindi or generic names.
const QUERY = {
  rotli: 'chapati',
  bajra_rotlo: 'bajra roti',
  vaghareli_khichdi: 'masala khichdi',
  bateta_nu_shaak: 'aloo sabzi',
  ringan_bateta: 'aloo baingan',
  bhinda_nu_shaak: 'bhindi sabzi',
  dudhi_chana: 'lauki chana dal',
  turiya_nu_shaak: 'ridge gourd curry',
  karela_nu_shaak: 'karela sabzi',
  tindora_nu_shaak: 'tindora ivy gourd fry',
  tinda_masala: 'tinda sabzi',
  guvar_nu_shaak: 'cluster beans curry',
  valor_papdi_shaak: 'papdi sabzi',
  sev_tameta: 'sev tameta',
  ringan_no_olo: 'baingan bharta',
  lasaniya_bateta: 'lasaniya batata',
  kobi_vatana: 'cabbage peas sabzi',
  bharela_ringan: 'bharwa baingan',
  methi_bateta: 'aloo methi',
  flower_bateta: 'aloo gobi',
  methi_muthiya: 'muthia',
  batata_poha: 'poha',
  plain_rice: 'steamed rice bowl',
  chaas: 'chaas buttermilk',
  kachumber: 'kachumber salad',
  sprouts_salad: 'sprouts salad',
  cucumber_raita: 'cucumber raita',
  papad_roasted: 'papadum',
  plain_curd: 'dahi curd bowl',
  shiro: 'sooji halwa',
  sukhdi: 'sukhdi',
  farali_bateta: 'jeera aloo',
  rajgira_puri: 'rajgira puri',
  samo_khichdi: 'samak rice khichdi',
  mag: 'moong curry',
  gujarati_dal: 'gujarati dal',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
for (const d of DISHES) {
  const q = QUERY[d.id] ?? d.name.en.split('(')[0].trim();
  out[d.id] = { name: d.name.en, query: q, candidates: await search(q) };
  await sleep(1500);
  process.stdout.write(`${d.id}: ${out[d.id].candidates.length}\n`);
}
writeFileSync(process.argv[2] ?? 'photo-candidates.json', JSON.stringify(out, null, 2));
