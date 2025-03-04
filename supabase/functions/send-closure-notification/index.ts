
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

interface ClosureNotificationRequest {
  surveyId: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received survey closure notification request");
    
    const { surveyId, userEmail }: ClosureNotificationRequest = await req.json();
    
    if (!surveyId) {
      throw new Error("Missing required surveyId");
    }

    // Fetch the survey details
    const { data: survey, error: surveyError } = await supabase
      .from('survey_templates')
      .select('name, creator_id')
      .eq('id', surveyId)
      .single();
    
    if (surveyError || !survey) {
      console.error("Error fetching survey:", surveyError);
      throw new Error("Survey not found");
    }

    // If userEmail is not provided, fetch the creator's email
    let recipientEmail = userEmail;
    if (!recipientEmail) {
      const { data: user, error: userError } = await supabase
        .auth.admin.getUserById(survey.creator_id);
      
      if (userError || !user?.user) {
        console.error("Error fetching user:", userError);
        throw new Error("User not found");
      }
      
      recipientEmail = user.user.email;
    }

    if (!recipientEmail) {
      throw new Error("Could not determine recipient email");
    }

    // Get response count
    const { count: responseCount, error: countError } = await supabase
      .from('survey_responses')
      .select('*', { count: 'exact', head: true })
      .eq('survey_template_id', surveyId);
    
    if (countError) {
      console.error("Error counting responses:", countError);
    }

    // Generate analysis URL
    const baseUrl = Deno.env.get("FRONTEND_URL") || "https://schoolpulse.org";
    const analysisUrl = `${baseUrl}/analysis/${surveyId}`;

    // Send the email notification
    console.log(`Sending survey closure notification to ${recipientEmail}`);
    
    const emailResponse = await resend.emails.send({
      from: "SchoolPulse <notifications@humankindaward.com>",
      to: [recipientEmail],
      subject: `Survey Closed: ${survey.name} - Results Available`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 16px;">Survey Closed: ${survey.name}</h1>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
            Your survey "${survey.name}" has now closed${responseCount !== undefined ? ` with ${responseCount} responses` : ''}.
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
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-closure-notification function:", error);
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
