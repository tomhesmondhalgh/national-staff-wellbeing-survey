
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminNotificationData {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  schoolName: string;
  schoolAddress: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, jobTitle, schoolName, schoolAddress }: AdminNotificationData = await req.json();

    if (!email || !firstName) {
      throw new Error("Missing required fields for admin notification");
    }

    console.log(`Preparing to send admin notification about new user: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Wellbeing Surveys <no-reply@creativeeducation.co.uk>",
      to: ["tom.hesmondhalgh@creativeeducation.co.uk"],
      subject: "New Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #6d28d9; margin-bottom: 20px;">New User Registration</h1>
          <p>A new user has registered for Wellbeing Surveys:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Job Title:</strong> ${jobTitle || 'Not provided'}</p>
            <p><strong>School/College:</strong> ${schoolName || 'Not provided'}</p>
            <p><strong>School Address:</strong> ${schoolAddress || 'Not provided'}</p>
          </div>
          <p>You can login to the admin portal to view more details about this user.</p>
        </div>
      `,
    });

    console.log("Admin notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-admin-notification function:", error);
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
