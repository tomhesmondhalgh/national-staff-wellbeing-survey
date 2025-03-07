
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { Resend } from 'https://esm.sh/resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  email: string;
  redirect_url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!resendApiKey) {
      throw new Error('Missing Resend API key');
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirect_url }: ResetPasswordRequest = await req.json();

    console.log(`Processing password reset request for email: ${email}`);
    console.log(`Redirect URL: ${redirect_url}`);

    // Generate a password reset token using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirect_url,
      }
    });

    if (error) {
      console.error("Password reset error details:", error);
      throw error;
    }

    if (!data || !data.properties || !data.properties.action_link) {
      throw new Error('Failed to generate password reset link');
    }

    // Get the reset link from Supabase response
    const resetLink = data.properties.action_link;
    console.log("Reset link generated:", resetLink);

    // Send the email using Resend directly
    const emailResponse = await resend.emails.send({
      from: "Wellbeing Surveys <no-reply@humankindaward.com>",
      to: email,
      subject: "Reset your Wellbeing Surveys password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reset Your Password</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header { 
              text-align: center;
              margin-bottom: 30px;
            }
            .title {
              color: #5a3ab6;
              font-size: 24px;
              font-weight: bold;
            }
            .btn {
              display: inline-block;
              background-color: #5a3ab6;
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 4px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Wellbeing Surveys</div>
          </div>
          
          <p>Hello,</p>
          
          <p>We received a request to reset your password for your Wellbeing Surveys account. Click the button below to set a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="btn">Reset Password</a>
          </div>
          
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          
          <p>This link will expire in 24 hours.</p>
          
          <p>Best regards,<br>The Wellbeing Surveys Team</p>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; Wellbeing Surveys. All rights reserved.</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent via Resend:", emailResponse);
    
    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Password reset email sent successfully"
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send password reset email' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
