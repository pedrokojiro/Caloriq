export type MealType = 'Café' | 'Almoço' | 'Jantar' | 'Lanche';

export type MacroNutrition = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type FoodItem = {
  id: string;
  emoji: string;
  name: string;
  portion: string;
  calories: number;
};

export type Meal = {
  id: string;
  title: string;
  type: MealType;
  imageUri?: string;
  createdAt: string;
  calories: number;
  confidence: number;
  foods: FoodItem[];
  macros: MacroNutrition;
  analysisSource?: 'openai' | 'demo' | 'error';
  analysisError?: string;
};

export type DailyGoal = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export type UserProfile = {
  name: string;
  email: string;
  age: number;
  weightKg: number;
  targetWeightKg: number;
  heightCm: number;
  objective: string;
  notifications: boolean;
  language: string;
  theme: string;
  memberSince: string;
};
