export type Lang = 'en' | 'hi' | 'gu';
export type Names = { en: string; hi?: string; gu?: string };

export type Diet = 'veg' | 'jain' | 'egg' | 'nonveg';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Course =
  | 'breakfast'
  | 'sabji'
  | 'dal'
  | 'bread'
  | 'rice'
  | 'oneDish'
  | 'farsan'
  | 'side'
  | 'sweet'
  | 'drink';
export type Cuisine =
  | 'gujarati'
  | 'punjabi'
  | 'south'
  | 'maharashtrian'
  | 'rajasthani'
  | 'bengali'
  | 'street'
  | 'indochinese'
  | 'continental'
  | 'pan';
export type Mood = 'comfort' | 'chatpata' | 'light' | 'heavy' | 'quick' | 'special';
export type VegType = 'leafy' | 'gourd' | 'beans' | 'root' | 'fruitveg' | 'paneer' | 'legume' | 'mixed';
export type Season = 'summer' | 'monsoon' | 'winter';
export type Unit = 'g' | 'ml' | 'tsp' | 'tbsp' | 'cup' | 'pc' | 'pinch';
export type SpiceLevel = 'low' | 'medium' | 'high';

/** [ingredient id, quantity for base servings, unit] */
export type DishIng = [string, number, Unit];

export interface Dish {
  id: string;
  name: Names;
  cuisine: Cuisine;
  course: Course;
  meals: Meal[];
  /** jain-ness is derived from ingredients, see isJain() */
  diet: Exclude<Diet, 'jain'>;
  upvas?: boolean;
  moods: Mood[];
  /** 1 = everyday ghar ka khana, 5 = party food */
  fancy: 1 | 2 | 3 | 4 | 5;
  /** items usually bought outside (pav, bread) */
  outside?: string[];
  time: number;
  serves: number;
  spicy: boolean;
  vegType?: VegType;
  season?: Season[];
  ings: DishIng[];
  steps: string[];
  /** YouTube video id once resolved; otherwise search query is built from name */
  video?: string;
  photo?: string;
  /** dish ids that go well alongside */
  pairs?: string[];
}

export type IngKind = 'main' | 'salt' | 'spice' | 'chilli' | 'oil' | 'sweet' | 'water';

export interface Ingredient {
  name: Names;
  kind: IngKind;
  /** per 100 g: kcal, protein g, carbs g, fat g, fibre g, sugar g, sodium mg */
  n: [number, number, number, number, number, number, number];
  /** grams in 1 tsp (default 5) */
  tsp?: number;
  /** grams in 1 piece */
  pc?: number;
  /** not allowed for jain. 'skip' = minor flavouring (ginger, garlic) that is simply left out */
  notJain?: true | 'skip';
}

export interface Nutrition {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
}

export interface Profile {
  diet: Diet;
  region: Cuisine;
  lang: Lang;
  people: number;
  spice: SpiceLevel;
  /** dish ids someone dislikes */
  dislikes: string[];
}
