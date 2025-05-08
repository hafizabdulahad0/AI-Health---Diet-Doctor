
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

    const prompt = `
      Create a personalized 7-day exercise plan for a person with the following details:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - Goal: ${profile.goal}
      - Health conditions: ${profile.disease || 'None'}
      
      The exercise plan should support their fitness goal of ${profile.goal}.
      
      Return the exercise plan as a JSON object with the following structure:
      {
        "Monday": {
          "warmup": "Detailed 5-10 minute warm-up routine",
          "main": "Detailed 20-30 minute main workout routine",
          "cooldown": "Detailed 5-10 minute cooldown routine"
        },
        "Tuesday": {
          ...and so on for all days of the week
        }
      }
      
      For each day, provide specific, appropriate exercises considering their physical attributes and goals.
      Include exercise names, repetitions/duration, and rest periods.
      Make sure to include rest days and vary the intensity throughout the week.
      Return ONLY the JSON object, no other text.
    `;

    console.log("Sending request to OpenAI API for exercise plan generation");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional fitness trainer specialized in creating personalized exercise plans."
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate exercise plan", details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
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
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      return new Response(
        JSON.stringify({ 
          error: "Could not parse exercise plan results",
          rawResponse: result.choices?.[0]?.message?.content || "No content",
          details: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify(exercisePlanData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
