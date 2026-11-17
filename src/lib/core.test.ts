/// <reference types="node" />
import assert from 'node:assert/strict';
import test from 'node:test';

import { INGREDIENTS } from '../data/ingredients.ts';
import { DISHES, DISH_BY_ID } from '../data/dishes/index.ts';
import { balanceTips, fitsDiet, isJain, jainSkips, perServing } from './nutrition.ts';
import { LIMITS, STAPLES, planWeek, swapDish, type DayPlan } from './planner.ts';
import { formatQty, scaleQty } from './scale.ts';
import type { Profile } from './types.ts';

const profile: Profile = { diet: 'veg', region: 'gujarati', lang: 'en', people: 4, spice: 'medium', dislikes: [] };

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
