
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded API key - in production, this should be a secret
const OPENAI_API_KEY = "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";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json();
    
    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Calculate BMI and caloric needs
    const bmi = Math.round((profile.weight / Math.pow(profile.height / 100, 2)) * 10) / 10;
    
    // Estimate base metabolic rate using Mifflin-St Jeor Equation
    let bmr = 0;
    if (profile.gender?.toLowerCase() === 'male') {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
    
    // Adjust for activity level (estimated moderate)
    const tdee = Math.round(bmr * 1.4);
    
    // Adjust calories based on goal
    let calorieTarget = tdee;
    if (profile.goal?.toLowerCase().includes("weight loss") || profile.goal?.toLowerCase().includes("lose weight")) {
      calorieTarget = Math.round(tdee * 0.8); // 20% deficit
    } else if (profile.goal?.toLowerCase().includes("muscle") || profile.goal?.toLowerCase().includes("gain")) {
      calorieTarget = Math.round(tdee * 1.1); // 10% surplus
    }
    
    // Determine any specific dietary needs based on health conditions
    const healthConsiderations = [];
    if (profile.disease) {
      if (profile.disease.toLowerCase().includes("diabetes")) {
        healthConsiderations.push("low glycemic index foods", "consistent carbohydrate intake throughout the day", "fiber-rich meals");
      } else if (profile.disease.toLowerCase().includes("hypertension")) {
        healthConsiderations.push("low sodium options", "DASH diet principles", "potassium-rich foods");
      } else if (profile.disease.toLowerCase().includes("heart")) {
        healthConsiderations.push("heart-healthy omega-3 sources", "limited saturated fat", "low sodium options");
      }
    }

    const prompt = `
      Create a comprehensive, scientifically-backed 7-day meal plan for an individual with the following detailed profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - BMI: ${bmi}
      - Estimated caloric needs: ${calorieTarget} calories per day
      - Diet preference: ${profile.dietPreference}
      - Goal: ${profile.goal}
      - Budget concern level: ${profile.budget}
      - Cuisine preference: ${profile.cuisine || 'Not specified'}
      - Health conditions: ${profile.disease || 'None'}
      ${healthConsiderations.length > 0 ? `- Special dietary considerations: ${healthConsiderations.join(", ")}` : ''}
      
      This meal plan should be specifically designed to support their fitness goal of "${profile.goal}" at approximately ${calorieTarget} calories per day while accommodating their dietary preferences and health conditions.
      
      Return the meal plan as a detailed JSON object with the following structure:
      {
        "Monday": {
          "breakfast": "Detailed breakfast recipe with exact ingredients, measurements, and preparation guidance. Include macronutrient estimates and calorie range.",
          "lunch": "Detailed lunch recipe with exact ingredients, measurements, and preparation guidance. Include macronutrient estimates and calorie range.",
          "dinner": "Detailed dinner recipe with exact ingredients, measurements, and preparation guidance. Include macronutrient estimates and calorie range.",
          "snacks": "1-2 nutritionally balanced snack options with timing recommendations"
        },
        "Tuesday": {
          ...and so on for all days of the week
        }
      }
      
      For each meal:
      1. Provide nutritionally balanced recommendations appropriate for their diet preference (${profile.dietPreference}) and health conditions
      2. Include exact ingredients with measurements and simple preparation instructions
      3. Offer cost-effective options that align with their budget concerns (${profile.budget})
      4. Incorporate foods from their preferred cuisine (${profile.cuisine || 'varied'}) when possible
      5. Include estimated macronutrient breakdown and calorie content
      6. Consider proper nutrient timing to support their fitness goals (${profile.goal})
      
      Return ONLY the JSON object, no introductory or concluding text.
    `;

    try {
      console.log("Trying OpenAI API for meal plan generation");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a professional nutritionist and dietitian specialized in creating personalized meal plans backed by scientific research. You create detailed, evidence-based nutrition plans tailored to individual needs, preferences, and health goals."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Received response from OpenAI API");
      
      let mealPlanData;
      
      try {
        // Check if we have a valid response with choices
        if (!result.choices || result.choices.length === 0) {
          throw new Error("No choices returned from OpenAI API");
        }
        
        // Extract the content from OpenAI response and parse it
        const content = result.choices[0].message.content;
        
        if (!content) {
          throw new Error("Empty content returned from OpenAI API");
        }
        
        console.log("Raw content from OpenAI:", content);
        
        // In case OpenAI returns text around the JSON
        const jsonMatch = content.match(/({[\s\S]*})/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        
        console.log("Attempting to parse JSON:", jsonStr);
        mealPlanData = JSON.parse(jsonStr);
        
        console.log("Successfully parsed meal plan data");
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        throw new Error("Could not parse meal plan results");
      }

      return new Response(
        JSON.stringify(mealPlanData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error("OpenAI error, falling back to free model:", openaiError);
      
      // Fallback to a more reliable free model
      try {
        console.log("Using OllamaHub Llama3 8B model for meal plan generation");
        
        // Using Ollama's free hosted API for llama3-8b
        const fallbackResponse = await fetch("https://api.ollamahub.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama3:8b",
            messages: [
              {
                role: "system",
                content: "You are a professional nutritionist and dietitian specialized in creating personalized meal plans backed by scientific research. You always respond with valid JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.4,
            max_tokens: 3000,
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Fallback model failed with status: ${fallbackResponse.status}`);
        }
        
        const fallbackResult = await fallbackResponse.json();
        
        // Extract the content
        let content;
        if (fallbackResult.choices && fallbackResult.choices.length > 0 && fallbackResult.choices[0].message) {
          content = fallbackResult.choices[0].message.content;
        } else {
          throw new Error("Invalid response format from fallback model");
        }
        
        // Try to extract just the JSON part
        const jsonMatch = content.match(/({[\s\S]*})/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        
        try {
          const mealPlanData = JSON.parse(jsonStr);
          return new Response(
            JSON.stringify(mealPlanData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (jsonError) {
          console.error("Could not parse fallback model JSON response:", jsonError);
          
          // Generate a simple but valid meal plan structure as fallback
          const simpleMealPlan = {
            "Monday": {
              breakfast: "Oatmeal with fresh berries and nuts. About 350 calories with 10g protein, 45g carbs, 15g fat.",
              lunch: "Grilled chicken salad with mixed vegetables and olive oil dressing. About 450 calories with 35g protein, 15g carbs, 25g fat.",
              dinner: "Baked salmon with quinoa and steamed vegetables. About 500 calories with 30g protein, 30g carbs, 25g fat."
            },
            "Tuesday": {
              breakfast: "Greek yogurt with honey and granola. About 300 calories with 20g protein, 40g carbs, 10g fat.",
              lunch: "Vegetable soup with whole grain bread. About 400 calories with 15g protein, 60g carbs, 10g fat.",
              dinner: "Lean beef stir-fry with brown rice and vegetables. About 550 calories with 35g protein, 60g carbs, 15g fat."
            },
            "Wednesday": {
              breakfast: "Whole grain toast with avocado and eggs. About 400 calories with 20g protein, 30g carbs, 25g fat.",
              lunch: "Quinoa bowl with beans, corn, and avocado. About 450 calories with 15g protein, 70g carbs, 15g fat.",
              dinner: "Baked chicken with sweet potato and green beans. About 500 calories with 35g protein, 40g carbs, 15g fat."
            },
            "Thursday": {
              breakfast: "Protein smoothie with banana and berries. About 350 calories with 25g protein, 45g carbs, 8g fat.",
              lunch: "Tuna sandwich on whole grain bread with side salad. About 400 calories with 30g protein, 40g carbs, 12g fat.",
              dinner: "Vegetable stir-fry with tofu and brown rice. About 450 calories with 20g protein, 60g carbs, 15g fat."
            },
            "Friday": {
              breakfast: "Overnight chia pudding with fruit. About 300 calories with 12g protein, 40g carbs, 10g fat.",
              lunch: "Lentil soup with side salad. About 400 calories with 20g protein, 55g carbs, 10g fat.",
              dinner: "Grilled fish with roasted vegetables. About 450 calories with 35g protein, 25g carbs, 20g fat."
            },
            "Saturday": {
              breakfast: "Whole grain pancakes with fresh fruit. About 400 calories with 15g protein, 70g carbs, 10g fat.",
              lunch: "Mediterranean salad with chickpeas and feta. About 400 calories with 15g protein, 30g carbs, 25g fat.",
              dinner: "Turkey meatballs with whole grain pasta. About 550 calories with 35g protein, 60g carbs, 15g fat."
            },
            "Sunday": {
              breakfast: "Vegetable omelet with whole grain toast. About 350 calories with 25g protein, 25g carbs, 15g fat.",
              lunch: "Chicken wrap with vegetables. About 450 calories with 30g protein, 45g carbs, 15g fat.",
              dinner: "Baked fish with quinoa and roasted vegetables. About 500 calories with 35g protein, 45g carbs, 15g fat."
            }
          };
          
          return new Response(
            JSON.stringify(simpleMealPlan),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fallbackError) {
        console.error("Fallback model failed:", fallbackError);
        
        // Create a very basic meal plan as a last resort
        const basicMealPlan = {
          "Monday": {
            breakfast: "Protein-rich breakfast suitable for your dietary preferences",
            lunch: "Balanced lunch with lean protein, complex carbs, and vegetables",
            dinner: "Nutritious dinner aligned with your health goals"
          },
          "Tuesday": {
            breakfast: "Whole grain breakfast option with fruit",
            lunch: "Vegetable-rich lunch with adequate protein",
            dinner: "Lean protein with vegetables and healthy carbs"
          },
          "Wednesday": {
            breakfast: "High-fiber breakfast option",
            lunch: "Protein and vegetable lunch combination",
            dinner: "Balanced dinner with all macronutrients"
          },
          "Thursday": {
            breakfast: "Protein smoothie or quick breakfast option",
            lunch: "Hearty lunch with adequate protein",
            dinner: "Light dinner with lean protein"
          },
          "Friday": {
            breakfast: "Nutritious breakfast with healthy fats",
            lunch: "Fiber-rich lunch option",
            dinner: "Protein-focused dinner with vegetables"
          },
          "Saturday": {
            breakfast: "Weekend breakfast option with balanced nutrients",
            lunch: "Satisfying lunch with plenty of vegetables",
            dinner: "Special dinner that fits your dietary needs"
          },
          "Sunday": {
            breakfast: "Relaxed breakfast with good protein content",
            lunch: "Light lunch option with vegetables",
            dinner: "Well-rounded dinner to prepare for the week"
          }
        };
        
        return new Response(
          JSON.stringify(basicMealPlan),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
