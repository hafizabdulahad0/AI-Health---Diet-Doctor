
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
    const { message, profile } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const userContext = profile ? `
      User health profile:
      - Age: ${profile.age}
      - Gender: ${profile.gender}
      - Height: ${profile.height} cm
      - Weight: ${profile.weight} kg
      - Diet preference: ${profile.dietPreference}
      - Goal: ${profile.goal}
      - Health conditions: ${profile.disease || 'None'}
      
      Based on the user's height and weight, their BMI is approximately ${Math.round((profile.weight / Math.pow(profile.height / 100, 2)) * 10) / 10}.
      
      When providing advice to this user:
      1. Keep in mind that their primary goal is ${profile.goal}
      2. They follow a ${profile.dietPreference} diet
      3. Consider any specific health conditions they've mentioned: ${profile.disease || 'None'}
      4. Tailor exercise recommendations to their specific age group (${profile.age} years old)
    ` : '';

    const systemPrompt = `
      You are a professional health and wellness assistant with extensive knowledge in nutrition, fitness, and medical science. 
      Your goal is to provide accurate, evidence-based information about health, nutrition, fitness, and general wellness.
      
      ${userContext}
      
      Guidelines for your responses:
      1. Provide personalized, science-backed advice based on the user's profile
      2. Be supportive, encouraging, and empathetic in your tone
      3. Explain complex health concepts in simple, accessible language
      4. For weight management, focus on sustainable, healthy approaches rather than extreme diets
      5. Consider the user's specific health conditions and dietary preferences in all recommendations
      6. When uncertain, acknowledge limitations and suggest consulting healthcare professionals
      7. Include practical, actionable steps the user can take to improve their health
      8. Support mental wellbeing alongside physical health goals
      
      Focus on being precise, comprehensive, and genuinely helpful.
    `;

    try {
      console.log("Trying OpenAI API for health chat");
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
              content: systemPrompt
            },
            { 
              role: "user", 
              content: message 
            }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Received response from OpenAI API");
      
      if (!result.choices || result.choices.length === 0 || !result.choices[0].message) {
        throw new Error("Invalid response format from OpenAI");
      }
      
      const botMessage = result.choices[0].message.content;

      return new Response(
        JSON.stringify({ content: botMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error("OpenAI error, falling back to free model:", openaiError);
      
      // Fallback to a more reliable free model via Ollama API
      try {
        console.log("Using OllamaHub Llama3 8B model for health chat");
        
        const ollama_prompt = `
        ${systemPrompt}
        
        User: ${message}
        
        Assistant:`;
        
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
                content: systemPrompt
              },
              {
                role: "user",
                content: message
              }
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback model failed with status: ${fallbackResponse.status}`);
        }
        
        const fallbackResult = await fallbackResponse.json();
        
        // Extract the assistant's response
        let assistantResponse;
        if (fallbackResult.choices && fallbackResult.choices.length > 0 && fallbackResult.choices[0].message) {
          assistantResponse = fallbackResult.choices[0].message.content;
        } else {
          throw new Error("Invalid response format from fallback model");
        }
        
        return new Response(
          JSON.stringify({ content: assistantResponse }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error("Fallback model failed:", fallbackError);
        return new Response(
          JSON.stringify({ 
            content: "I apologize for the inconvenience, but I'm currently experiencing technical difficulties. Our team is working to resolve this issue. In the meantime, please try again later." 
          }),
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
