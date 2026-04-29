import { DailyGoal, UserProfile } from './types';

export const defaultGoal: DailyGoal = {
  calories: 2000,
  protein: 120,
  carbs: 220,
  fat: 65,
  fiber: 30,
};

export const defaultProfile: UserProfile = {
  name: 'Mariana Silva',
  email: 'mariana@email.com',
  age: 28,
  weightKg: 68,
  targetWeightKg: 65,
  heightCm: 165,
  objective: 'Perda de peso moderada',
  notifications: true,
  language: 'Português',
  theme: 'Claro',
  memberSince: 'jan. 2024',
};
