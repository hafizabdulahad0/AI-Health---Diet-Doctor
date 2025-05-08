
// User Types
export interface User {
  id: string;
  email: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  disease?: string;
  dietPreference: 'vegetarian' | 'non-vegetarian' | 'vegan';
  budget: 'low' | 'medium' | 'high';
  goal: 'weight loss' | 'weight gain' | 'maintenance';
  cuisine: string;
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
  id?: string;
  userId?: string;
  isBot: boolean;
  content: string;
  createdAt?: string;
}

// Food Analysis and Meal Plans
export interface FoodAnalysis {
  calories: string;
  nutrients: string[];
  pros: string[];
  cons: string[];
  recommendation: string;
}

export interface MealPlan {
  [day: string]: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

export interface ExercisePlan {
  [day: string]: {
    warmup: string;
    main: string;
    cooldown: string;
  };
}

// OpenAI API Key Settings
export interface ApiKeySettings {
  openaiApiKey: string;
}
