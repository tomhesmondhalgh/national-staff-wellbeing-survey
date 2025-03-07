
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
  type: 'survey' | 'analysis' | 'closure';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received test email request");
    
    const { email, type }: TestEmailRequest = await req.json();
    
    if (!email) {
      throw new Error("Missing required email address");
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address");
    }

    let response;
    
    // Test data for different email types
    const testSurveyId = "test-survey-id";
    const testSurveyName = "Test Survey";
    const testSurveyUrl = "https://schoolpulse.org/survey?id=test-survey-id";
    
    switch (type) {
      case 'survey':
        console.log(`Sending test survey email to ${email}`);
        
        response = await resend.emails.send({
          from: "Wellbeing Surveys <no-reply@humankindaward.com>",
          to: [email],
          subject: `You're invited to complete the "${testSurveyName}" wellbeing survey`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Wellbeing Survey Invitation (TEST)</h1>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                This is a TEST email. You have been invited to participate in the "${testSurveyName}" wellbeing survey.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Your feedback is important to help improve the wellbeing of staff at your school.
                The survey is anonymous and will only take a few minutes to complete.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${testSurveyUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Complete Survey
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
                If the button above doesn't work, copy and paste this link into your browser: 
                <a href="${testSurveyUrl}" style="color: #3b82f6; text-decoration: underline;">${testSurveyUrl}</a>
              </p>
              
              <p style="color: #ef4444; font-size: 14px; line-height: 1.5; margin-top: 32px; font-style: italic;">
                This is a TEST email sent from the SchoolPulse application.
              </p>
            </div>
          `,
        });
        break;
        
      case 'analysis':
        console.log(`Sending test analysis email to ${email}`);
        
        // Create a simplified version of the analysis email
        response = await resend.emails.send({
          from: "SchoolPulse <notifications@humankindaward.com>",
          to: [email],
          subject: `Survey Analysis Report: ${testSurveyName} (TEST)`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Survey Analysis Report: ${testSurveyName} (TEST)</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
              <h1 style="text-align: center; color: #3b82f6; margin-bottom: 30px;">Survey Analysis Report (TEST)</h1>
              <h2 style="text-align: center; color: #4b5563; margin-bottom: 30px;">${testSurveyName}</h2>
              
              <div style="margin: 20px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #111827;">AI-Powered Summary</h3>
                
                <div style="margin-bottom: 15px;">
                  <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #047857;">Areas of Strength</h4>
                  <ul style="padding-left: 20px; margin-top: 0;">
                    <li style="margin-bottom: 8px;">Staff feel supported by their colleagues</li>
                    <li style="margin-bottom: 8px;">Communication between management and staff is effective</li>
                    <li style="margin-bottom: 8px;">Professional development opportunities are valued</li>
                  </ul>
                </div>
                
                <div>
                  <h4 style="margin-top: 0; margin-bottom: 10px; font-size: 16px; color: #b45309;">Areas for Improvement</h4>
                  <ul style="padding-left: 20px; margin-top: 0;">
                    <li style="margin-bottom: 8px;">Work-life balance could be better</li>
                    <li style="margin-bottom: 8px;">More recognition for staff achievements</li>
                    <li style="margin-bottom: 8px;">Reducing administrative workload</li>
                  </ul>
                </div>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px; color: #111827;">Recommendation Score</h3>
                <div style="display: flex; justify-content: center; text-align: center;">
                  <div style="margin: 0 30px;">
                    <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px;">7.5</p>
                    <p style="margin-top: 0; color: #6b7280;">Your School</p>
                  </div>
                  <div style="margin: 0 30px;">
                    <p style="font-size: 24px; font-weight: bold; color: #6b7280; margin-bottom: 5px;">6.8</p>
                    <p style="margin-top: 0; color: #6b7280;">National Average</p>
                  </div>
                </div>
              </div>
              
              <p style="color: #ef4444; font-size: 14px; line-height: 1.5; margin-top: 32px; font-style: italic; text-align: center;">
                This is a TEST email sent from the SchoolPulse application.
              </p>
            </body>
            </html>
          `,
        });
        break;
        
      case 'closure':
        console.log(`Sending test closure notification to ${email}`);
        
        const baseUrl = "https://schoolpulse.org";
        const analysisUrl = `${baseUrl}/analysis/${testSurveyId}`;
        
        response = await resend.emails.send({
          from: "SchoolPulse <notifications@humankindaward.com>",
          to: [email],
          subject: `Survey Closed: ${testSurveyName} - Results Available (TEST)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Survey Closed: ${testSurveyName} (TEST)</h1>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Your survey "${testSurveyName}" has now closed with 25 responses.
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                You can now view the analysis and results of your survey.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${analysisUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  View Survey Results
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
                If the button above doesn't work, copy and paste this link into your browser: 
                <a href="${analysisUrl}" style="color: #3b82f6; text-decoration: underline;">${analysisUrl}</a>
              </p>
              
              <p style="color: #ef4444; font-size: 14px; line-height: 1.5; margin-top: 32px; font-style: italic;">
                This is a TEST email sent from the SchoolPulse application.
              </p>
            </div>
          `,
        });
        break;
        
      default:
        throw new Error("Invalid email type");
    }

    console.log("Test email sent successfully:", response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-test-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
