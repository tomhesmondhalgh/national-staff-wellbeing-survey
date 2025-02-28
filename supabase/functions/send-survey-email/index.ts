
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SurveyEmailRequest {
  surveyId: string;
  surveyName: string;
  emails: string[];
  surveyUrl: string;
  isReminder: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }

    const resend = new Resend(resendApiKey);
    const { surveyId, surveyName, emails, surveyUrl, isReminder } = await req.json() as SurveyEmailRequest;

    console.log(`Sending ${isReminder ? "reminder" : "invitation"} emails for survey: ${surveyName} (${surveyId})`);
    console.log(`Recipients: ${emails.join(", ")}`);

    if (!emails || emails.length === 0) {
      throw new Error("No email recipients provided");
    }

    // Send emails one by one to avoid exposing recipients to each other
    const results = await Promise.all(
      emails.map(async (email) => {
        const subject = isReminder 
          ? `Reminder: Please complete the "${surveyName}" wellbeing survey`
          : `You're invited to take the "${surveyName}" wellbeing survey`;

        const emailResponse = await resend.emails.send({
          from: "Wellbeing Survey <wellbeing@resend.dev>",
          to: [email],
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">${isReminder ? 'Reminder' : 'You\'re Invited'}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                ${isReminder 
                  ? `This is a gentle reminder to complete the "${surveyName}" wellbeing survey.` 
                  : `You have been invited to participate in the "${surveyName}" wellbeing survey.`}
              </p>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                Your feedback is important and will help us improve wellbeing support for all staff.
                The survey is anonymous and should take less than 5 minutes to complete.
              </p>
              <div style="margin: 30px 0;">
                <a href="${surveyUrl}" 
                   style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  ${isReminder ? 'Complete Survey Now' : 'Take Survey'}
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                If you have any questions or issues accessing the survey, please contact your administrator.
              </p>
            </div>
          `,
        });

        return emailResponse;
      })
    );

    console.log(`Successfully sent ${results.length} emails`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${isReminder ? "Reminders" : "Invitations"} sent successfully`,
        count: results.length 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error sending emails:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send emails" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
