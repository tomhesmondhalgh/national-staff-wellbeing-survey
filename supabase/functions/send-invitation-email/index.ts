
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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

    // Initialize Supabase client with Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    console.log(`Would send invitation email to ${invitation.email} for ${orgName}`);
    console.log(`Accept URL: ${acceptUrl}`);
    
    // For now we'll just log the email details since we haven't set up email sending
    // In a real implementation, you would use Resend or another email service here

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email logged (would be sent in production)",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
