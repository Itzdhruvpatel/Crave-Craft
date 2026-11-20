/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';

import { INGREDIENTS } from '../data/ingredients.ts';
import { DISHES, DISH_BY_ID } from '../data/dishes/index.ts';
import { STEPS_GU, STEPS_HI } from '../data/steps.ts';
import { FESTIVALS, LEFTOVERS } from '../data/collections.ts';
import { cookFromFridge, keyIngredients } from './fridge.ts';
import { formatBuy, groceryList } from './grocery.ts';
import { clock, stepMinutes } from './timer.ts';
import { balanceTips, fitsDiet, isJain, jainSkips, perServing } from './nutrition.ts';
import { LIMITS, STAPLES, planWeek, swapDish, type DayPlan } from './planner.ts';
import { formatQty, scaleQty } from './scale.ts';
import { streak } from './streak.ts';
import type { Profile } from './types.ts';

const profile: Profile = { diet: 'veg', regions: ['gujarati'], lang: 'en', people: 4, spice: 'medium', dislikes: [] };

test('dish data is valid', () => {
  const ids = new Set<string>();
  for (const d of DISHES) {
    assert.ok(!ids.has(d.id), `duplicate id ${d.id}`);
    ids.add(d.id);
    assert.ok(d.steps.length > 0, `${d.id} has no steps`);
    assert.ok(d.meals.length > 0, `${d.id} has no meals`);
    for (const [ing, qty] of d.ings) {
      assert.ok(INGREDIENTS[ing], `${d.id}: unknown ingredient ${ing}`);
      assert.ok(qty > 0, `${d.id}: bad qty for ${ing}`);
    }
  }
  for (const d of DISHES) for (const p of d.pairs ?? []) assert.ok(ids.has(p), `${d.id} pairs unknown ${p}`);
});

test('translated steps match their English recipe line for line', () => {
  for (const [lang, map] of [['gu', STEPS_GU], ['hi', STEPS_HI]] as const) {
    for (const [id, steps] of Object.entries(map)) {
      const d = DISH_BY_ID.get(id);
      assert.ok(d, `${lang}: unknown dish ${id}`);
      assert.equal(steps.length, d.steps.length, `${lang} ${id}: ${steps.length} steps vs ${d.steps.length} in English`);
    }
  }
});

test('nutrition per serving is plausible', () => {
  for (const d of DISHES) {
    const n = perServing(d);
    assert.ok(n.kcal > 0 && n.kcal < 1200, `${d.id} kcal ${n.kcal}`);
    assert.ok(n.sodium < 2500, `${d.id} sodium ${n.sodium}`);
  }
  const dal = perServing(DISH_BY_ID.get('gujarati_dal')!);
  assert.ok(dal.protein > 6 && dal.protein < 15, `dal protein ${dal.protein}`);
});

test('spice scaling', () => {
  // main ingredient scales linearly
  assert.equal(scaleQty(['potato', 4, 'pc'], 8, 4, 'medium', true), 8);
  // salt grows slower than servings
  const salt = scaleQty(['salt', 1, 'tsp'], 8, 4, 'medium', true);
  assert.ok(salt > 1.5 && salt < 2);
  // chilli follows spice level, only for spicy dishes
  assert.equal(scaleQty(['red_chilli', 1, 'tsp'], 4, 4, 'high', true), 1.5);
  assert.equal(scaleQty(['red_chilli', 1, 'tsp'], 4, 4, 'low', true), 0.5);
  assert.equal(scaleQty(['red_chilli', 1, 'tsp'], 4, 4, 'high', false), 1);
  assert.equal(formatQty(0.5, 'tsp'), '½ tsp');
  assert.equal(formatQty(1.3, 'tsp'), '1¼ tsp');
  assert.equal(formatQty(0.05, 'tsp'), '¼ tsp');
  assert.equal(formatQty(143, 'g'), '145 g');
  assert.equal(formatQty(2.2, 'pc'), '2');
});

test('diet filters', () => {
  assert.ok(isJain(DISH_BY_ID.get('khaman')!)); // ginger is skipped, not a blocker
  assert.deepEqual(jainSkips(DISH_BY_ID.get('khaman')!), ['ginger']);
  assert.ok(!isJain(DISH_BY_ID.get('bateta_nu_shaak')!));
  assert.ok(!fitsDiet(DISH_BY_ID.get('ringan_no_olo')!, 'jain'));
});

function allIds(plan: DayPlan[]) {
  return plan.flatMap((d) => [...d.breakfast, ...d.lunch, ...d.dinner]);
}

test('week plan follows the rules for many seeds', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed });
    assert.equal(plan.length, 7);
    const ids = allIds(plan);
    const special = ids.filter((id) => !STAPLES.includes(DISH_BY_ID.get(id)!.course));
    assert.equal(new Set(special).size, special.length, `seed ${seed}: repeated non-staple dish`);
    const dishes = [...new Set(ids)].map((id) => DISH_BY_ID.get(id)!);
    assert.ok(dishes.filter((d) => d.fancy >= 4).length <= LIMITS.fancy, `seed ${seed}: too fancy`);
    assert.ok(dishes.filter((d) => d.moods.includes('chatpata')).length <= LIMITS.chatpata, `seed ${seed}: too chatpata`);
    assert.ok(dishes.filter((d) => d.outside?.length).length <= LIMITS.outside, `seed ${seed}: too much outside food`);
    for (const day of plan) {
      const dayIds = [...day.breakfast, ...day.lunch, ...day.dinner];
      assert.equal(new Set(dayIds).size, dayIds.length, `seed ${seed}: same dish twice in a day`);
      assert.equal(day.breakfast.length, 1);
      assert.ok(day.lunch.length >= 3, `seed ${seed} ${day.date}: lunch ${day.lunch}`);
      assert.ok(day.dinner.length >= 1);
    }
  }
});

test('fancy dishes mostly land on weekends', () => {
  let weekday = 0;
  let weekend = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed }); // Monday
    plan.forEach((day, i) => {
      const n = [...day.breakfast, ...day.lunch, ...day.dinner].filter((id) => DISH_BY_ID.get(id)!.fancy >= 4).length;
      if (i >= 5) weekend += n;
      else weekday += n;
    });
  }
  assert.ok(weekend > weekday * 2, `weekend ${weekend} vs weekday ${weekday}`);
});

test('everyday rotli beats puri for lunch', () => {
  let rotli = 0;
  let puri = 0;
  for (let seed = 1; seed <= 100; seed++) {
    for (const day of planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed })) {
      if (day.lunch.includes('rotli')) rotli++;
      if (day.lunch.includes('puri')) puri++;
    }
  }
  assert.ok(rotli > puri * 4, `rotli ${rotli} vs puri ${puri}`);
});

test('several cooking styles rotate the lunch format', () => {
  const plan = planWeek(DISHES, { ...profile, regions: ['gujarati', 'south'] }, { start: new Date(2026, 10, 16), seed: 2 });
  // Gujarati days: sabji, dal, bread, rice. South days: dal, sabji, rice (no bread).
  const courses = (i: number) => plan[i].lunch.map((id) => DISH_BY_ID.get(id)!.course);
  assert.ok(courses(0).includes('bread'));
  assert.ok(!courses(1).includes('bread'));
});

test('grocery list sums a week and scales with family size', () => {
  const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed: 4 });
  const four = groceryList(plan, DISH_BY_ID, 4, 'medium');
  const eight = groceryList(plan, DISH_BY_ID, 8, 'medium');
  assert.ok(four.length > 15, `only ${four.length} items`);
  assert.ok(!four.some((i) => i.id === 'water'));
  const atta4 = four.find((i) => i.id === 'atta');
  const atta8 = eight.find((i) => i.id === 'atta');
  if (atta4 && atta8) assert.ok(Math.abs(atta8.qty - 2 * atta4.qty) <= 2, 'main ingredients double for double people');
  assert.equal(formatBuy({ id: 'x', aisle: 'veg', qty: 1234, unit: 'g', dishes: [] }), '1.3 kg');
  assert.equal(formatBuy({ id: 'x', aisle: 'veg', qty: 320, unit: 'g', dishes: [] }), '350 g');
  assert.equal(formatBuy({ id: 'x', aisle: 'veg', qty: 6, unit: 'pc', dishes: [] }), '6 pcs');
});

test('festival and leftover menus only list real dishes', () => {
  for (const c of [...FESTIVALS, ...LEFTOVERS]) for (const id of c.dishIds) assert.ok(DISH_BY_ID.has(id), `${c.id}: unknown ${id}`);
});

test('fridge mode ranks dishes by what is missing', () => {
  const matches = cookFromFridge(['potato', 'peas', 'cauliflower'], DISHES);
  assert.ok(matches.length > 0);
  assert.ok(matches[0].missing.length <= matches[matches.length - 1].missing.length);
  assert.ok(matches.some((m) => m.dish.id === 'aloo_matar' && m.missing.length === 0));
  assert.ok(!keyIngredients(DISH_BY_ID.get('aloo_matar')!).includes('salt'));
});

test('cook mode finds timers in steps', () => {
  assert.equal(stepMinutes('Boil 10 to 12 minutes on medium.'), 12);
  assert.equal(stepMinutes('Cover and rest 15 minutes.'), 15);
  assert.equal(stepMinutes('Rest 2 hours covered.'), 120);
  assert.equal(stepMinutes('Pressure cook 3 whistles.'), null);
  assert.equal(clock(605), '10:05');
});

test('fast days only use upvas dishes', () => {
  const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed: 7, fastDays: [2] });
  const fast = plan[2];
  assert.ok(fast.fast);
  for (const id of [...fast.breakfast, ...fast.lunch, ...fast.dinner]) assert.ok(DISH_BY_ID.get(id)!.upvas, id);
});

test('jain plan has no onion, garlic or root veg', () => {
  const plan = planWeek(DISHES, { ...profile, diet: 'jain' }, { start: new Date(2026, 10, 16), seed: 3 });
  for (const id of allIds(plan)) assert.ok(isJain(DISH_BY_ID.get(id)!), id);
});

test('swap keeps course and avoids repeats', () => {
  const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed: 11 });
  const before = plan[0].lunch[0];
  const after = swapDish(plan, 0, 'lunch', 0, DISHES, profile, 5);
  const now = after[0].lunch[0];
  assert.notEqual(now, before);
  assert.equal(DISH_BY_ID.get(now)!.course, DISH_BY_ID.get(before)!.course);
  const day = [...after[0].breakfast, ...after[0].lunch, ...after[0].dinner];
  assert.equal(new Set(day).size, day.length);
});

test('balance tips suggest protein when meal is light', () => {
  const meal = ['bateta_nu_shaak', 'rotli'].map((id) => DISH_BY_ID.get(id)!);
  const tips = balanceTips(meal, DISHES, 'veg');
  assert.ok(tips.some((t) => t.reason === 'protein' && t.dishIds.length > 0));
});

test('dry staples show katori beside grams, pinch as chapti', () => {
  assert.equal(formatQty(240, 'g', 'en', 'rice'), '240 g (2 katori)');
  assert.equal(formatQty(240, 'g', 'gu', 'rice'), '240 ગ્રામ (2 વાટકી)');
  assert.equal(formatQty(30, 'g', 'en', 'rice'), '30 g');
  assert.equal(formatQty(10, 'g', 'en', 'salt'), '10 g');
  assert.equal(formatQty(1, 'pinch'), '1 chapti');
  assert.equal(formatQty(0.5, 'tsp', 'hi'), '½ छोटी चम्मच');
});

test('loved dishes come up more often than meh ones', () => {
  const id = 'bhinda_nu_shaak';
  assert.ok(DISH_BY_ID.get(id), id);
  const count = (rating: 1 | -1) => {
    let n = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const plan = planWeek(DISHES, { ...profile, ratings: { [id]: rating } }, { start: new Date(2026, 10, 16), seed });
      n += allIds(plan).filter((x) => x === id).length;
    }
    return n;
  };
  assert.ok(count(1) > count(-1));
});

test('guests add to the shopping for their day only', () => {
  const plan = planWeek(DISHES, profile, { start: new Date(2026, 10, 16), seed: 5 }).slice(0, 1);
  const base = groceryList(plan, DISH_BY_ID, 4, 'medium').find((i) => i.unit === 'g')!;
  const party = groceryList([{ ...plan[0], guests: 4 }], DISH_BY_ID, 4, 'medium').find((i) => i.id === base.id)!;
  assert.ok(party.qty > base.qty * 1.8, `${party.qty} vs ${base.qty}`);
});

test('thank-you streak counts days in a row', () => {
  const today = new Date(2026, 10, 20);
  assert.equal(streak(['2026-11-18', '2026-11-19', '2026-11-20'], today), 3);
  assert.equal(streak(['2026-11-18', '2026-11-19'], today), 2);
  assert.equal(streak(['2026-11-17'], today), 0);
  assert.equal(streak(['2026-10-31', '2026-11-01'], new Date(2026, 10, 1)), 2);
});

test('clock shows hours for long countdowns', () => {
  assert.equal(clock(65), '1:05');
  assert.equal(clock(3725), '1:02:05');
});
