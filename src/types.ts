
export interface UserProfile {
  userId: string;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  goal: string;
  dietPreference: string;
  fitnessLevel?: string;
  disease?: string;
  budget?: string;
  cuisine?: string;
}

export interface FoodAnalysis {
  calories: string;
  nutrients: string[];
  pros: string[];
  cons: string[];
  recommendation: string;
}

export interface DayMeals {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks?: string;
}

export interface MealPlan {
  [day: string]: DayMeals;
}

export interface DayExercises {
  warmup: string;
  main: string;
  cooldown: string;
}

export interface ExercisePlan {
  [day: string]: DayExercises;
}

export interface DailyRecord {
  id: string;
  userId: string;
  date: string;
  dayNumber: number;
  exercise: boolean;
  dietFollowed: boolean;
  newWeight: number;
  createdAt: string;
}

export interface ChatMessage {
  isBot: boolean;
  content: string;
}

// Add this for the ApiKeyContext
export interface ApiKeySettings {
  openaiApiKey: string;
}
