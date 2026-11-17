# Crave Craft design

Goal: mom never has to ask "what should I cook?" again, and the family gets a shared space around food.

## Build stages (one app, built in this order)

1. Core: diet setup, dish library, recipe page (servings + spice scaling, nutrition, balance tips, video), weekly balanced planner, today screen, languages (English, Hindi, Gujarati).
2. Family Table: invite link, roles (HOD, member, simple mode), today's menu, surprise mode with timed reveal, polls, petitions with bribes, chat with voice notes, who's eating today, ratings, appreciation wall, push notifications.
3. Extras: grocery list, fridge mode, leftovers, guest mode, festival and fasting menus, cook mode, more regions and languages, family recipe book.

## Data model

Dish: id, names per language, cuisine, course, meals, diet, jain, upvas, moods, fancy (1-5), outside items, time, base servings, spicy flag, vegetable type, season, ingredients `[ingredientId, qty, unit]`, steps, video query.

Ingredient: id, names, kind (main, salt, spice, chilli, oil, sweet), nutrition per 100 g, grams per tsp and per piece.

## Spice scaling

- factor = servings / base servings
- main ingredients: qty x factor
- salt and spices: qty x factor^0.85 (salt does not grow linearly with batch size)
- chilli: same as spices, times level (low 0.5, medium 1, high 1.5)
- oil: qty x factor^0.9
- dishes with `spicy: false` hide the spice selector

The exponents are a starting point; mom's test cooking calibrates them.

## Weekly planner rules

- Lunch: sabji + dal + bread + rice. Dinner: alternates one-dish meals and sabji + bread. Breakfast: one dish.
- No dish repeats within the week. No same vegetable type on consecutive days.
- At most 2 fancy dishes (fancy >= 4), 2 chatpata dishes and 1 meal with outside items per week.
- Disliked dishes get lower weight, never removed. Seasonal dishes get higher weight.
- Fasting days use upvas dishes only.

## Nutrition

Ingredient values are approximations based on IFCT 2017 (NIN Hyderabad). Balance targets per meal follow ICMR-NIN 2024 guidelines loosely: if protein or fibre is low, suggest a side (raita, sprouts, salad, dal).

## Media

- Videos: trusted channel list. A script resolves each dish to one real video ID with the YouTube Data API (free key) and stores it. Until then the app opens a YouTube search limited to the dish name plus a trusted channel.
- Photos: video thumbnail of the resolved video, or a free-licence photo (Wikimedia Commons), or the family's own photo.

## Costs

All free tiers. Only optional paid items: Play Store ($25, skipped), custom domain (skipped), AI chat (later, optional).
