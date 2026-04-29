import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultGoal, defaultProfile } from './defaults';
import { DailyGoal, Meal, UserProfile } from './types';

const KEYS = {
  meals: '@caloriq/meals',
  goal: '@caloriq/goal',
  profile: '@caloriq/profile',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getMeals(): Promise<Meal[]> {
  const meals = await readJson<Meal[]>(KEYS.meals, []);
  return meals.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function saveMeal(meal: Meal): Promise<void> {
  const meals = await getMeals();
  await writeJson(KEYS.meals, [meal, ...meals.filter(item => item.id !== meal.id)]);
}

export async function getMealById(id: string): Promise<Meal | null> {
  const meals = await getMeals();
  return meals.find(meal => meal.id === id) ?? null;
}

export async function deleteMeal(id: string): Promise<void> {
  const meals = await getMeals();
  await writeJson(KEYS.meals, meals.filter(meal => meal.id !== id));
}

export async function getGoal(): Promise<DailyGoal> {
  return readJson<DailyGoal>(KEYS.goal, defaultGoal);
}

export async function saveGoal(goal: DailyGoal): Promise<void> {
  await writeJson(KEYS.goal, goal);
}

export async function getProfile(): Promise<UserProfile> {
  return readJson<UserProfile>(KEYS.profile, defaultProfile);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await writeJson(KEYS.profile, profile);
}

export function isToday(date: string) {
  const value = new Date(date);
  const now = new Date();
  return (
    value.getFullYear() === now.getFullYear() &&
    value.getMonth() === now.getMonth() &&
    value.getDate() === now.getDate()
  );
}

export function formatMealTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDayTitle(date: string) {
  const value = new Date(date);
  if (isToday(date)) return 'Hoje';

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(value);
}
