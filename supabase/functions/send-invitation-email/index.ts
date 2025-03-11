
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@1.0.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    if (!resend) {
      throw new Error("Resend API key not configured");
    }

    const requestData = await req.json();
    const { email, organizationName, role, invitedBy, token } = requestData;
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const roleDisplay = {
      viewer: "Viewer (can view data only)",
      editor: "Editor (can edit surveys and responses)",
      organization_admin: "Administrator (full access to organization)"
    }[role] || role;
    
    const { data, error } = await resend.emails.send({
      from: "Wellbeing Survey <no-reply@resend.dev>",
      to: email,
      subject: `Invitation to join ${organizationName || "Wellbeing Survey"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #5e35b1;">You've been invited to join ${organizationName || "Wellbeing Survey"}</h2>
          <p>You've been invited by <strong>${invitedBy || "an administrator"}</strong> to join ${organizationName || "Wellbeing Survey"} as a <strong>${roleDisplay}</strong>.</p>
          <p>To accept this invitation, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL") || "https://bagaaqkmewkuwtudwnqw.supabase.co"}/invitation/accept?token=${token}" 
              style="background-color: #5e35b1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-invitation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
