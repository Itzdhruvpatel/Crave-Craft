import type { Dish } from './types.ts';

// What dadi says out loud, turned into an action. Plain keyword matching in English, Hindi,
// Gujarati and Hinglish; no server needed.

export type Command =
  | { kind: 'menu' }
  | { kind: 'recipe'; dish: Dish }
  | { kind: 'request'; dish: Dish }
  | { kind: 'message'; text: string };

const MENU = ['aaj kya', 'aaje shu', 'aaje su', 'menu', 'kya bana', 'shu banyu', 'आज क्या', 'खाने में क्या', 'આજે શું', 'શું બન્યું', 'જમવામાં શું'];
const RECIPE = ['kaise', 'kem banav', 'recipe', 'rit', 'vidhi', 'कैसे', 'विधि', 'रेसिपी', 'કેવી રીતે', 'કેમ બનાવ', 'રીત'];
const REQUEST = ['banao', 'banavo', 'banana', 'banavje', 'khana hai', 'khavu', 'बनाओ', 'बनाना', 'खाना है', 'બનાવો', 'બનાવજો', 'ખાવું'];

const clean = (s: string) => s.toLowerCase().replace(/[.,!?।]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

/** Longest dish name (any language) heard in the sentence wins, so "dal dhokli" beats "dal". */
export function findDish(text: string, dishes: Dish[]): Dish | undefined {
  const said = clean(text);
  let best: Dish | undefined;
  let len = 0;
  for (const d of dishes) {
    for (const n of Object.values(d.name)) {
      const name = n ? clean(n) : '';
      if (name.length > len && said.includes(name)) {
        best = d;
        len = name.length;
      }
    }
  }
  return best;
}

export function parseCommand(text: string, dishes: Dish[]): Command {
  const said = clean(text);
  const dish = findDish(said, dishes);
  if (dish && has(said, RECIPE)) return { kind: 'recipe', dish };
  if (dish && has(said, REQUEST)) return { kind: 'request', dish };
  if (has(said, MENU)) return { kind: 'menu' };
  if (dish) return { kind: 'recipe', dish };
  return { kind: 'message', text: text.trim() };
}
