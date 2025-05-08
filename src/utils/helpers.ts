
import { UserProfile, FoodAnalysis, MealPlan, ExercisePlan } from "@/types";

export function calculateBMI(weight: number, height: number): number {
  // Calculate BMI: weight (kg) / (height (m))²
  return Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10;
}

export function getBMIStatus(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy Weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function calculateTargetWeight(height: number, currentWeight: number): number {
  // Calculate ideal weight range based on BMI 18.5-24.9
  const minWeight = Math.round(18.5 * Math.pow(height / 100, 2) * 10) / 10;
  const maxWeight = Math.round(24.9 * Math.pow(height / 100, 2) * 10) / 10;
  
  // Return target based on current position
  if (currentWeight < minWeight) return minWeight; // Need to gain weight
  if (currentWeight > maxWeight) return maxWeight; // Need to lose weight
  return currentWeight; // Already at a healthy weight
}

// Mock API calls - in a real app these would connect to a backend
export async function analyzeFoodMock(profile: UserProfile, food: string): Promise<FoodAnalysis> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock food analysis
  return {
    calories: `${Math.floor(Math.random() * 300 + 100)} kcal`,
    nutrients: [
      "Protein: 12g",
      "Carbohydrates: 45g",
      "Fat: 7g",
      "Fiber: 8g"
    ],
    pros: [
      "High in protein",
      "Contains essential vitamins",
      "Good source of fiber"
    ],
    cons: [
      "Contains moderate sodium",
      "Processing may reduce nutritional value"
    ],
    recommendation: `Based on your ${profile.goal} goal, this food is a reasonable option, but be mindful of portion size.`
  };
}

export async function getDailyDietPlanMock(profile: UserProfile): Promise<MealPlan> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock meal plan
  return {
    "Monday": {
      breakfast: "Oatmeal with berries and nuts",
      lunch: "Grilled chicken salad with olive oil dressing",
      dinner: "Baked salmon with roasted vegetables"
    },
    "Tuesday": {
      breakfast: "Greek yogurt with honey and granola",
      lunch: "Lentil soup with whole grain bread",
      dinner: "Turkey stir-fry with mixed vegetables"
    },
    "Wednesday": {
      breakfast: "Whole grain toast with avocado and eggs",
      lunch: "Quinoa bowl with roasted vegetables and chickpeas",
      dinner: "Grilled lean beef with sweet potato and green beans"
    },
    "Thursday": {
      breakfast: "Smoothie with spinach, banana, and protein powder",
      lunch: "Whole grain wrap with tuna and vegetables",
      dinner: "Chicken breast with brown rice and broccoli"
    },
    "Friday": {
      breakfast: "Chia seed pudding with almond milk and fruits",
      lunch: "Bean and vegetable soup with whole grain crackers",
      dinner: "Baked fish with quinoa and roasted asparagus"
    },
    "Saturday": {
      breakfast: "Whole grain pancakes with fresh berries",
      lunch: "Grilled vegetable and mozzarella sandwich",
      dinner: "Tofu stir-fry with brown rice and vegetables"
    },
    "Sunday": {
      breakfast: "Vegetable omelet with whole grain toast",
      lunch: "Mediterranean salad with feta cheese and olives",
      dinner: "Grilled chicken with sweet potato and green salad"
    }
  };
}

export async function getDailyExercisePlanMock(profile: UserProfile): Promise<ExercisePlan> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return mock exercise plan
  return {
    "Monday": {
      warmup: "5 minutes light cardio, dynamic stretches",
      main: "Upper body strength: 3 sets of push-ups, rows, and shoulder presses",
      cooldown: "Light stretching focusing on upper body"
    },
    "Tuesday": {
      warmup: "5 minutes jumping jacks and arm circles",
      main: "Lower body workout: 3 sets of squats, lunges, and calf raises",
      cooldown: "Static stretching for legs and lower back"
    },
    "Wednesday": {
      warmup: "5 minutes light jogging in place",
      main: "Cardio: 20 minutes interval training (alternate between high and low intensity)",
      cooldown: "Gentle walking and full body stretches"
    },
    "Thursday": {
      warmup: "5 minutes arm swings and leg swings",
      main: "Core workout: 3 sets of planks, bicycle crunches, and Russian twists",
      cooldown: "Yoga poses focusing on core and flexibility"
    },
    "Friday": {
      warmup: "5 minutes light cardio and dynamic stretches",
      main: "Full body circuit: 3 rounds of burpees, mountain climbers, and jumping jacks",
      cooldown: "Foam rolling and static stretches"
    },
    "Saturday": {
      warmup: "5 minutes brisk walking",
      main: "Active recovery: 30 minutes light cardio (walking, swimming, or cycling)",
      cooldown: "Gentle full body stretches"
    },
    "Sunday": {
      warmup: "5 minutes light mobility exercises",
      main: "Rest day or 20 minutes gentle yoga",
      cooldown: "Deep breathing and meditation"
    }
  };
}
