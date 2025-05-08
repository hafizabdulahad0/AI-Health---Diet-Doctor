
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
    ` : '';

    const systemPrompt = `
      You are a professional health and wellness assistant. Your goal is to provide accurate, 
      helpful information about nutrition, fitness, and general health. 
      
      ${userContext}
      
      When providing advice:
      1. Be supportive and encouraging
      2. Base your advice on scientific evidence
      3. Personalize recommendations based on the user's profile when possible
      4. If you're uncertain about something, acknowledge it and provide general guidance
      5. For weight goals, focus on sustainable, healthy approaches
      6. Always consider any health conditions mentioned in the user profile
      
      Keep your responses focused on health, nutrition, and fitness.
    `;

    console.log("Sending request to OpenAI API for health chat");
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
            content: systemPrompt
          },
          { 
            role: "user", 
            content: message 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate response", details: errorData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      );
    }

    const result = await response.json();
    console.log("Received response from OpenAI API");
    
    if (!result.choices || result.choices.length === 0 || !result.choices[0].message) {
      console.error("Invalid response format from OpenAI:", result);
      return new Response(
        JSON.stringify({ error: "Invalid response from AI assistant" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const botMessage = result.choices[0].message.content;

    return new Response(
      JSON.stringify({ content: botMessage }),
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
