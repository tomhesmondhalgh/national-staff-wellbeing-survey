
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
    const analysisUrl = "https://example.com/analysis?id=test-123";
    
    // Updated: Use a consistent verified sender address format
    // Send test survey invitation email
    const invitationResponse = await resend.emails.send({
      from: "Wellbeing Surveys <notifications@creativeeducation.co.uk>",
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
    
    // Updated: Use a consistent verified sender address format
    // Send test reminder email
    const reminderResponse = await resend.emails.send({
      from: "Wellbeing Surveys <notifications@creativeeducation.co.uk>",
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
    
    // Updated: Use a consistent verified sender address format
    // Send test closure notification email
    const closureResponse = await resend.emails.send({
      from: "Wellbeing Surveys <notifications@creativeeducation.co.uk>",
      to: email,
      subject: `[TEST] Your survey "${surveyName}" has now closed - see the results...`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">[TEST] Survey Closed</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            This is a <strong>TEST EMAIL</strong>. Your wellbeing survey "${surveyName}" has now closed.
          </p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Thank you for gathering valuable feedback from your staff. You can now view the complete analysis and insights from the survey responses.
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
          
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            This is a test email. No action is required.
          </p>
        </div>
      `,
    });
    
    const responseData = {
      success: true,
      message: `Test emails sent to ${email}`,
      results: {
        invitation: invitationResponse,
        reminder: reminderResponse,
        closure: closureResponse
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
