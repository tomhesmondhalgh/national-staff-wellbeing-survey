
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recommendationScore, 
      leavingContemplation, 
      detailedResponses, 
      textResponses 
    } = await req.json();

    // Check if we have enough data (changed from 20 to 10)
    const totalResponses = Object.values(leavingContemplation).reduce((sum: number, value: number) => sum + value, 0);
    if (totalResponses < 10) {
      return new Response(JSON.stringify({ insufficientData: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare the data for the OpenAI API
    const detailedResponsesText = detailedResponses.map((question: any) => {
      const schoolPositive = (question.schoolResponses["Strongly Agree"] || 0) + 
                           (question.schoolResponses["Agree"] || 0);
      const schoolNegative = (question.schoolResponses["Disagree"] || 0) + 
                           (question.schoolResponses["Strongly Disagree"] || 0);

      return `Question: ${question.question}
      Positive responses: ${schoolPositive}%
      Negative responses: ${schoolNegative}%`;
    }).join('\n\n');

    const leavingContemplationText = Object.entries(leavingContemplation)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const doingWellResponses = textResponses.doingWell
      .map((item: any) => item.response)
      .join('\n- ');

    const improvementsResponses = textResponses.improvements
      .map((item: any) => item.response)
      .join('\n- ');

    // Create a prompt for the OpenAI API
    const prompt = `
    You are an educational analyst reviewing staff wellbeing survey data. Analyze the following data and provide:
    1. A brief introduction paragraph
    2. 3-5 bullet points highlighting areas of strength
    3. 3-5 bullet points highlighting areas for improvement/development
    
    SURVEY DATA:
    Recommendation Score: ${recommendationScore.score} (National Average: ${recommendationScore.nationalAverage})
    
    Staff Contemplating Leaving: 
    ${leavingContemplationText}
    
    Detailed Question Responses:
    ${detailedResponsesText}
    
    What the organization does well (free text responses):
    - ${doingWellResponses}
    
    What the organization could improve (free text responses):
    - ${improvementsResponses}
    
    FORMAT YOUR RESPONSE IN THIS EXACT FORMAT:
    {
      "introduction": "A brief paragraph summarizing the overall findings...",
      "strengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5"],
      "improvements": ["Area for improvement 1", "Area for improvement 2", "Area for improvement 3", "Area for improvement 4", "Area for improvement 5"]
    }

    Only include strengths and improvements that are clearly supported by the data. If there are fewer than 5 clear points for either category, include only those that are well-supported. Keep bullet points concise and actionable.
    `;

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an educational analyst reviewing staff wellbeing survey data.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }

    try {
      const aiResponse = data.choices[0].message.content;
      // Parse the JSON response
      const parsedResponse = JSON.parse(aiResponse);
      
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response:', data.choices[0].message.content);
      
      // If parsing fails, return a structured error response
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        rawResponse: data.choices[0].message.content
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
