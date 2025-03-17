
// Using a more recent version of the Deno standard library
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// Using a newer version of Resend that's compatible with Deno
import { Resend } from "https://esm.sh/resend@2.0.0";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { surveyId, surveyName, creator, analysisUrl } = await req.json();
    
    if (!surveyId || !surveyName || !creator?.email) {
      throw new Error("Missing required fields: surveyId, surveyName, and creator email are required");
    }
    
    console.log(`Sending closure notification for survey: ${surveyName} (${surveyId})`);
    console.log(`To creator: ${creator.email}`);
    console.log(`Analysis URL: ${analysisUrl}`);
    
    // Initialize Resend with API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    
    const resend = new Resend(resendApiKey);
    
    // Format the creator name
    const creatorName = creator.firstName && creator.lastName
      ? `${creator.firstName} ${creator.lastName}`
      : creator.email.split('@')[0];
    
    // Updated: Use a consistent verified sender address format
    const response = await resend.emails.send({
      from: "Wellbeing Surveys <notifications@creativeeducation.co.uk>",
      to: creator.email,
      subject: `Your survey "${surveyName}" has now closed - see the results...`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Survey Closed</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Hello ${creatorName},
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Your wellbeing survey "${surveyName}" has now closed. Thank you for gathering valuable feedback from your staff.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            You can now view the complete analysis and insights from the survey responses.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${analysisUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Survey Results
            </a>
          </div>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            These insights will help you understand the wellbeing of your staff and identify areas where support may be needed.
          </p>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
            If the button above doesn't work, copy and paste this link into your browser: 
            <a href="${analysisUrl}" style="color: #3b82f6; text-decoration: underline;">${analysisUrl}</a>
          </p>
        </div>
      `,
    });
    
    console.log("Email sent successfully:", response);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Closure notification sent to ${creator.email}`,
        data: response,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
