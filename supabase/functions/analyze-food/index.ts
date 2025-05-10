
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

    // Build a detailed context from user profile
    const dietContext = profile ? `
      User dietary profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - BMI: ${Math.round((profile.weight / Math.pow(profile.height / 100, 2)) * 10) / 10}
      - Diet preference: ${profile.dietPreference || 'Not specified'}
      - Goal: ${profile.goal || 'Not specified'}
      - Health conditions: ${profile.disease || 'None'}
      
      Given this profile, please take special consideration of:
      ${profile.disease ? `- Their health condition (${profile.disease}) when analyzing nutritional impact` : ''}
      ${profile.goal ? `- Their fitness goal (${profile.goal}) when making recommendations` : ''}
      ${profile.dietPreference ? `- Their dietary preference (${profile.dietPreference})` : ''}
    ` : '';

    const prompt = `
      Analyze the following food item in comprehensive detail: "${food}".
      
      ${dietContext}
      
      Provide a thorough nutritional analysis in the following JSON format:
      {
        "calories": "calories in specific format like '240 kcal per 100g serving'",
        "nutrients": ["Protein: specific amount", "Carbs: specific amount", "Fat: specific amount", "Fiber: specific amount", "Vitamins: key vitamins present"],
        "pros": ["4-5 detailed health benefits with scientific reasoning"],
        "cons": ["4-5 detailed health risks or downsides for specific populations"],
        "recommendation": "Personalized, detailed advice based on the user's dietary preferences, health goals, and any medical conditions. Include suggestions for portion control, optimal timing of consumption, and potential complementary foods."
      }
      
      Be specific, accurate, evidence-based and thorough in your analysis. Return ONLY the JSON object, no other text.
    `;

    try {
      console.log(`Trying OpenAI API for analyzing food: "${food}"`);
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
              content: "You are a professional nutritionist specialized in providing detailed food analysis backed by scientific research."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
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
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        throw new Error("Could not parse analysis results");
      }

      return new Response(
        JSON.stringify(analysisData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error("OpenAI error, falling back to free model:", openaiError);
      
      // Fallback to a reliable free model
      try {
        console.log("Using OllamaHub Llama3 8B model for food analysis");
        
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
                content: "You are a professional nutritionist specialized in providing detailed food analysis backed by scientific research. You always respond with valid JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3,
            max_tokens: 1000,
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
          const analysisData = JSON.parse(jsonStr);
          return new Response(
            JSON.stringify(analysisData),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (jsonError) {
          // If we can't parse the JSON, create a simple valid JSON response
          const fallbackAnalysis = {
            calories: "Approximately 100-300 kcal per 100g serving (estimate)",
            nutrients: [
              "Protein: 5-15g (estimate)",
              "Carbs: 10-30g (estimate)",
              "Fat: 2-10g (estimate)",
              "Fiber: 2-5g (estimate)",
              "Vitamins: Varies by food type"
            ],
            pros: [
              "Provides essential nutrients",
              "Part of a balanced diet",
              "Contains natural food compounds",
              "Accessible food option"
            ],
            cons: [
              "May contain allergens for some individuals",
              "Portion control is important",
              "Preparation method affects nutritional value",
              "May interact with certain medications"
            ],
            recommendation: `For your ${profile?.goal || 'health goals'}, ${food} can be included as part of a balanced diet. Consider portion sizes and preparation methods that align with your ${profile?.dietPreference || 'dietary preferences'}.`
          };
          
          return new Response(
            JSON.stringify(fallbackAnalysis),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fallbackError) {
        console.error("Fallback model failed:", fallbackError);
        
        // Create a simple generic response as a last resort
        const genericAnalysis = {
          calories: "Varies based on preparation (100-300 kcal per serving)",
          nutrients: [
            "Protein: Moderate amount",
            "Carbs: Moderate amount",
            "Fat: Varies by preparation",
            "Fiber: Present in most whole foods",
            "Vitamins: Various essential nutrients"
          ],
          pros: [
            "Part of a varied diet",
            "Provides energy and nutrients",
            "Can support overall health",
            "Natural food option"
          ],
          cons: [
            "Individual responses may vary",
            "Preparation affects nutritional profile",
            "May not suit all dietary needs",
            "Quality and sourcing matter"
          ],
          recommendation: "Our systems are currently unable to provide a detailed analysis. We recommend consulting a nutritionist for personalized advice about this food item."
        };
        
        return new Response(
          JSON.stringify(genericAnalysis),
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
