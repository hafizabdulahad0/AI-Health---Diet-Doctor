
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

    // Calculate BMI for better exercise recommendations
    const bmi = Math.round((profile.weight / Math.pow(profile.height / 100, 2)) * 10) / 10;
    
    // Determine fitness level based on profile information
    let fitnessLevel = "beginner";
    if (profile.fitnessLevel) {
      fitnessLevel = profile.fitnessLevel;
    } else if (profile.goal?.toLowerCase().includes("muscle") || profile.goal?.toLowerCase().includes("strength")) {
      fitnessLevel = "intermediate";
    }
    
    // Determine if there are special considerations based on health conditions
    const hasHealthConditions = profile.disease && profile.disease !== "None";

    const prompt = `
      Create a comprehensive, personalized 7-day exercise plan for a client with the following profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - BMI: ${bmi}
      - Goal: ${profile.goal}
      - Health conditions: ${profile.disease || 'None'}
      - Current fitness level: ${fitnessLevel}
      
      This plan should be specifically designed to support their fitness goal of "${profile.goal}" while accommodating any health limitations.
      
      Return the exercise plan as a detailed JSON object with the following structure:
      {
        "Monday": {
          "warmup": "Detailed 5-10 minute warm-up routine with specific exercises, repetitions, and form guidance",
          "main": "Detailed 20-40 minute main workout routine with specific exercises, sets, repetitions, rest periods, and proper form guidance",
          "cooldown": "Detailed 5-10 minute cooldown routine with specific stretches and duration"
        },
        "Tuesday": {
          ...and so on for all days of the week
        }
      }
      
      For each day:
      1. Provide scientifically-backed exercises appropriate for their fitness level (${fitnessLevel}) and goals
      2. Include specific exercise names, exact repetitions/duration, and detailed rest periods
      3. ${hasHealthConditions ? `Provide specific modifications for exercises that might be contraindicated by their health condition (${profile.disease})` : 'Consider their age and fitness level when designing exercises'}
      4. Incorporate progressive overload principles throughout the week
      5. Include proper form guidance to prevent injury
      6. Strategically include rest days and vary intensity throughout the week based on the client's fitness level
      7. For older adults (60+), focus on balance, flexibility and joint-friendly exercises
      8. For younger adults, design age-appropriate intensity levels
      
      Return ONLY the JSON object, no introductory or concluding text.
    `;

    try {
      console.log("Trying OpenAI API for exercise plan generation");
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
              content: "You are a professional fitness trainer and exercise physiologist with expertise in creating personalized exercise plans. You create detailed, scientifically-based workout routines tailored to individual needs and goals."
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
      
      let exercisePlanData;
      
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
        
        console.log("Attempting to parse JSON");
        exercisePlanData = JSON.parse(jsonStr);
        console.log("Successfully parsed exercise plan data");
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        throw new Error("Could not parse exercise plan results");
      }

      return new Response(
        JSON.stringify(exercisePlanData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error("OpenAI error, falling back to free model:", openaiError);
      
      // Fallback to a more reliable free model
      try {
        console.log("Using OllamaHub Llama3 8B model for exercise plan generation");
        
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
                content: "You are a professional fitness trainer and exercise physiologist with expertise in creating personalized exercise plans. You always respond with valid JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.4,
            max_tokens: 2000,
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
          const exercisePlanData = JSON.parse(jsonStr);
          return new Response(
            JSON.stringify(exercisePlanData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (jsonError) {
          console.error("Could not parse fallback model JSON response:", jsonError);
          
          // Generate a simple but valid exercise plan structure as fallback
          const simpleExercisePlan = {
            "Monday": {
              warmup: "5-10 minutes of light cardio (walking or cycling) followed by dynamic stretches for major muscle groups.",
              main: `${fitnessLevel === 'beginner' ? 'Beginner' : 'Standard'} full body workout: 3 sets of 10-12 reps of bodyweight squats, modified push-ups, assisted lunges, and standing rows. Rest 60-90 seconds between sets.`,
              cooldown: "5-10 minutes of static stretching focusing on worked muscle groups, holding each stretch for 20-30 seconds."
            },
            "Tuesday": {
              warmup: "5 minutes of jumping jacks or marching in place followed by arm circles and leg swings.",
              main: `Cardio session: ${fitnessLevel === 'beginner' ? '20' : '30'} minutes of moderate-intensity walking, swimming or cycling. Keep heart rate at 60-70% of maximum.`,
              cooldown: "5 minutes of gentle walking followed by full-body stretching routine."
            },
            "Wednesday": {
              warmup: "5-10 minutes of light activity and dynamic movements for mobility.",
              main: `${fitnessLevel === 'beginner' ? 'Basic' : 'Intermediate'} core workout: 3 sets of modified planks (20-30 seconds), gentle bridges, and controlled leg lifts. Focus on proper form rather than speed.`,
              cooldown: "Gentle stretching focusing on the back and core muscles."
            },
            "Thursday": {
              warmup: "Light aerobic activity and dynamic stretching.",
              main: `Rest day or active recovery: gentle walking for 20 minutes or ${fitnessLevel === 'beginner' ? 'beginner' : 'appropriate level'} yoga flow.`,
              cooldown: "Deep breathing exercises and relaxation techniques."
            },
            "Friday": {
              warmup: "5 minutes of step-ups or marching in place followed by mobility exercises for shoulders and hips.",
              main: `Upper body focus: 3 sets of 10-12 reps of wall push-ups or regular push-ups (based on ability), band rows, shoulder press with light weights, and tricep dips. Adjust intensity to ${fitnessLevel} level.`,
              cooldown: "Upper body and neck stretches, holding each for 20-30 seconds."
            },
            "Saturday": {
              warmup: "Light cardio warmup for 5 minutes and dynamic lower body movements.",
              main: `Lower body focus: 3 sets of 10-15 reps of bodyweight squats, step-ups, glute bridges, and calf raises. ${fitnessLevel === 'beginner' ? 'Take longer rest periods as needed' : 'Rest 60 seconds between sets'}.`,
              cooldown: "Lower body stretching routine focusing on quads, hamstrings, and calves."
            },
            "Sunday": {
              warmup: "Gentle full body mobility exercises.",
              main: "Complete rest day or light walking in nature for mental and physical recovery.",
              cooldown: "Full body stretching and relaxation techniques."
            }
          };
          
          return new Response(
            JSON.stringify(simpleExercisePlan),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fallbackError) {
        console.error("Fallback model failed:", fallbackError);
        
        // Create a very basic exercise plan as a last resort
        const basicExercisePlan = {
          "Monday": {
            warmup: "5 minutes of light cardio and dynamic stretches",
            main: "Full body workout with basic exercises appropriate for your fitness level",
            cooldown: "5 minutes of static stretching"
          },
          "Tuesday": {
            warmup: "5 minutes of light movement to increase heart rate",
            main: "Cardio session adjusted to your fitness level",
            cooldown: "Gentle stretching and breathing exercises"
          },
          "Wednesday": {
            warmup: "Joint mobility exercises",
            main: "Core-focused workout with appropriate modifications",
            cooldown: "Stretching focusing on worked muscles"
          },
          "Thursday": {
            warmup: "Light movement",
            main: "Rest day or gentle activity like walking",
            cooldown: "Relaxation techniques"
          },
          "Friday": {
            warmup: "Dynamic stretches for upper body",
            main: "Upper body strengthening exercises",
            cooldown: "Upper body stretches"
          },
          "Saturday": {
            warmup: "Dynamic stretches for lower body",
            main: "Lower body strengthening exercises",
            cooldown: "Lower body stretches"
          },
          "Sunday": {
            warmup: "Gentle mobility work",
            main: "Rest day for recovery",
            cooldown: "Full body stretching"
          }
        };
        
        return new Response(
          JSON.stringify(basicExercisePlan),
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
