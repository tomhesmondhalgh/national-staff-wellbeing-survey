
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
    const { email } = await req.json();
    
    if (!email) {
      throw new Error("Email address is required");
    }
    
    console.log(`Sending test emails to: ${email}`);
    
    // Initialize Resend with API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    
    const resend = new Resend(resendApiKey);
    
    // Prepare example data for emails
    const surveyName = "Test Survey";
    const surveyUrl = "https://example.com/survey?id=test-123";
    
    // Send test survey invitation email
    const invitationResponse = await resend.emails.send({
      from: "Wellbeing Surveys <no-reply@humankindaward.com>",
      to: email,
      subject: `[TEST] You're invited to complete the "${surveyName}" wellbeing survey`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">[TEST] Wellbeing Survey Invitation</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            This is a <strong>TEST EMAIL</strong>. You have been invited to participate in the "${surveyName}" wellbeing survey.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Your feedback is important to help improve the wellbeing of staff at your school.
            The survey is anonymous and will only take a few minutes to complete.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${surveyUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Survey
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
            If the button above doesn't work, copy and paste this link into your browser: 
            <a href="${surveyUrl}" style="color: #3b82f6; text-decoration: underline;">${surveyUrl}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            This is a test email. No action is required.
          </p>
        </div>
      `,
    });
    
    // Send test reminder email
    const reminderResponse = await resend.emails.send({
      from: "Wellbeing Surveys <no-reply@humankindaward.com>",
      to: email,
      subject: `[TEST] Reminder: Please complete the "${surveyName}" wellbeing survey`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">[TEST] Reminder: Wellbeing Survey</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            This is a <strong>TEST EMAIL</strong>. This is a friendly reminder to complete the "${surveyName}" wellbeing survey.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Your feedback is important to help improve the wellbeing of staff at your school.
            The survey is anonymous and will only take a few minutes to complete.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${surveyUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Complete Survey
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
            If the button above doesn't work, copy and paste this link into your browser: 
            <a href="${surveyUrl}" style="color: #3b82f6; text-decoration: underline;">${surveyUrl}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            This is a test email. No action is required.
          </p>
        </div>
      `,
    });
    
    // Send test analysis email
    const analysisResponse = await resend.emails.send({
      from: "SchoolPulse <onboarding@resend.dev>",
      to: email,
      subject: `[TEST] Survey Analysis Report: ${surveyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Survey Analysis Report: ${surveyName}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="text-align: center; color: #3b82f6; margin-bottom: 30px;">[TEST] Survey Analysis Report</h1>
          <h2 style="text-align: center; color: #4b5563; margin-bottom: 30px;">${surveyName}</h2>
          
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #111827;">AI-Powered Summary</h3>
            
            <div style="margin-bottom: 15px;">
              <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #047857;">Areas of Strength</h4>
              <ul style="padding-left: 20px; margin-top: 0;">
                <li style="margin-bottom: 8px;">Staff feel valued by leadership</li>
                <li style="margin-bottom: 8px;">Good work-life balance compared to national average</li>
                <li style="margin-bottom: 8px;">High scores for team collaboration</li>
              </ul>
            </div>
            
            <div>
              <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #b45309;">Areas for Improvement</h4>
              <ul style="padding-left: 20px; margin-top: 0;">
                <li style="margin-bottom: 8px;">Communication during periods of change</li>
                <li style="margin-bottom: 8px;">Professional development opportunities</li>
                <li style="margin-bottom: 8px;">Recognition of individual contributions</li>
              </ul>
            </div>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #111827;">Recommendation Score</h3>
            <div style="display: flex; justify-content: center; text-align: center;">
              <div style="margin: 0 30px;">
                <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px;">7.8</p>
                <p style="margin-top: 0; color: #6b7280;">Your School</p>
              </div>
              <div style="margin: 0 30px;">
                <p style="font-size: 24px; font-weight: bold; color: #6b7280; margin-bottom: 5px;">6.5</p>
                <p style="margin-top: 0; color: #6b7280;">National Average</p>
              </div>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            This is a test email. No action is required.
          </p>
        </body>
        </html>
      `,
    });
    
    const responseData = {
      success: true,
      message: `Test emails sent to ${email}`,
      results: {
        invitation: invitationResponse,
        reminder: reminderResponse,
        analysis: analysisResponse
      },
    };
    
    return new Response(
      JSON.stringify(responseData),
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
