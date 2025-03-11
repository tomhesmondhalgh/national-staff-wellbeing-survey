
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitationId, organizationName }: InvitationEmailRequest = await req.json();
    console.log(`Processing invitation email request for invitation ID: ${invitationId}`);

    // Initialize Supabase client with Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    
    if (!resend) {
      throw new Error("Failed to initialize Resend - API key might be missing");
    }

    // Get invitation details
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

    // Get inviter profile
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

    console.log(`Sending invitation email to ${invitation.email} for ${orgName}`);
    console.log(`Accept URL: ${acceptUrl}`);
    
    // Format a role name for display (convert organization_admin to Organization Admin)
    const formatRole = (role: string) => {
      return role
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Education Wellbeing <onboarding@resend.dev>",
      to: [invitation.email],
      subject: `You've been invited to join ${orgName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6941C6; text-align: center;">Team Invitation</h1>
          <p>Hello,</p>
          <p>${inviterName} has invited you to join <strong>${orgName}</strong> as a <strong>${formatRole(invitation.role)}</strong>.</p>
          <p>Click the button below to accept this invitation:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" style="background-color: #6941C6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact the person who invited you.</p>
          <p>Thank you,<br>Education Wellbeing Team</p>
        </div>
      `,
    });

    console.log("Email sending response:", emailResponse);

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
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
