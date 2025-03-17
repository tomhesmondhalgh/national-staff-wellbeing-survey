
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitationId: string;
  organizationName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId, organizationName }: InvitationEmailRequest = await req.json();
    console.log(`Processing invitation email request for invitation ID: ${invitationId}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    console.log("Initializing Resend with API key length:", resendApiKey.length);
    
    const resend = new Resend(resendApiKey);

    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (invitationError || !invitation) {
      console.error("Error fetching invitation:", invitationError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invitation not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", invitation.invited_by)
      .maybeSingle();

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim()
      : "Someone";

    const orgName = organizationName || "an organization";
    const acceptUrl = `${Deno.env.get("FRONTEND_URL") || "http://localhost:3000"}/invitation/accept?token=${invitation.token}`;

    console.log(`Preparing to send invitation email to ${invitation.email} for ${orgName}`);
    console.log(`Using accept URL: ${acceptUrl}`);
    
    const formatRole = (role: string) => {
      return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Updated: Use a consistent verified sender address format
    const emailData = {
      from: "Wellbeing Surveys <notifications@creativeeducation.co.uk>",
      to: [invitation.email],
      subject: "You have been invited to access our wellbeing surveys",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h1 style="color: #6941C6; text-align: center; margin-bottom: 20px;">You've Been Invited!</h1>
          
          <p>Hello,</p>
          
          <p>${inviterName} has invited you to join <strong>${orgName}</strong> as a <strong>${formatRole(invitation.role)}</strong> to access their wellbeing surveys platform.</p>
          
          <p>With this access, you'll be able to:</p>
          <ul style="margin-bottom: 20px;">
            <li>View and analyze wellbeing data</li>
            <li>Track progress over time</li>
            <li>Create action plans to improve wellbeing outcomes</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #6941C6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              Accept Invitation & Create Account
            </a>
          </div>
          
          <p style="margin-top: 20px; font-size: 14px; color: #666;">This invitation will expire in 7 days. If you have any questions, please contact the person who invited you.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>Wellbeing Surveys | Improving organizational wellbeing</p>
          </div>
        </div>
      `,
    };

    console.log("Sending email with data:", {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from
    });

    try {
      const emailResponse = await resend.emails.send(emailData);
      console.log("Resend API Response:", emailResponse);

      if (!emailResponse?.id) {
        throw new Error("No email ID returned from Resend");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Invitation email sent successfully",
          data: emailResponse
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (emailError: any) {
      console.error("Resend API Error:", {
        message: emailError.message,
        stack: emailError.stack,
        details: emailError.response?.data || emailError.response || emailError
      });
      throw emailError;
    }
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
