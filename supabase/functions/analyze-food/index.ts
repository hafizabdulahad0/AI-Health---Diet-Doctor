
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
    const { food, profile } = await req.json();
    
    if (!food) {
      return new Response(
        JSON.stringify({ error: 'Food item is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get dietary preferences and goals from profile if available
    const dietContext = profile ? `
      User dietary info:
      - Goal: ${profile.goal || 'Not specified'}
      - Diet preference: ${profile.dietPreference || 'Not specified'}
      - Weight: ${profile.weight || 'Not specified'} kg
      - Health conditions: ${profile.disease || 'None'}
    ` : '';

    const prompt = `
      Analyze the following food item in detail: "${food}".
      
      ${dietContext}
      
      Provide a comprehensive nutritional analysis in the following JSON format:
      {
        "calories": "calories in format like '240 kcal'",
        "nutrients": ["Protein: amount", "Carbs: amount", "Fat: amount", "Fiber: amount"],
        "pros": ["3-4 health benefits"],
        "cons": ["3-4 health risks or downsides"],
        "recommendation": "Personalized advice based on the user's dietary preferences and health goals."
      }
      
      Be specific, accurate, and evidence-based in your analysis. Return ONLY the JSON object, no other text.
    `;

    console.log(`Analyzing food: "${food}"`);
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
            content: "You are a professional nutritionist specialized in providing detailed food analysis."
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
        JSON.stringify({ error: "Failed to analyze food", details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const result = await response.json();
    console.log("Received response from OpenAI API");
    
    let analysisData;
    
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
      analysisData = JSON.parse(jsonStr);
      console.log("Successfully parsed food analysis data");
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      return new Response(
        JSON.stringify({ 
          error: "Could not parse analysis results",
          rawResponse: result.choices?.[0]?.message?.content || "No content",
          details: error.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify(analysisData),
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
