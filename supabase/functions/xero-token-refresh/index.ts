
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token exchange URL
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';

// Environment configuration
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const xeroClientId = Deno.env.get('XERO_CLIENT_ID') as string;
const xeroClientSecret = Deno.env.get('XERO_CLIENT_SECRET') as string;

// Log environment variable status (without revealing their values)
console.log('Environment variables check:');
console.log(`SUPABASE_URL: ${supabaseUrl ? 'Present' : 'Missing'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Present' : 'Missing'}`);
console.log(`XERO_CLIENT_ID: ${xeroClientId ? 'Present' : 'Missing'}`);
console.log(`XERO_CLIENT_SECRET: ${xeroClientSecret ? 'Present' : 'Missing'}`);

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface XeroTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify environment variables
    if (!xeroClientId || !xeroClientSecret) {
      console.error('Missing required environment variables for Xero token refresh');
      return new Response(
        JSON.stringify({ 
          error: 'Configuration error', 
          details: 'Missing required Xero API credentials'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check authorization
    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'administrator')
      .maybeSingle();

    if (rolesError || !roles) {
      console.error('Admin check error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current Xero refresh token
    const { data: xeroData, error: xeroError } = await supabase
      .from('xero_credentials')
      .select('refresh_token, expires_at')
      .eq('id', 1)
      .maybeSingle();
      
    if (xeroError) {
      console.error('Error getting Xero credentials:', xeroError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve Xero credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!xeroData) {
      console.error('No Xero credentials found');
      return new Response(
        JSON.stringify({ error: 'Xero is not connected' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token needs refreshing
    const expiresAt = new Date(xeroData.expires_at);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const refreshThreshold = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    if (timeUntilExpiry > refreshThreshold) {
      console.log('Token does not need refreshing yet');
      return new Response(
        JSON.stringify({ 
          refreshed: false, 
          message: 'Token does not need refreshing yet', 
          expires_at: xeroData.expires_at,
          time_until_expiry_mins: Math.round(timeUntilExpiry / 60000)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Refresh the token
    console.log('Refreshing Xero token...');
    
    const tokenResponse = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${xeroClientId}:${xeroClientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: xeroData.refresh_token
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh error:', tokenResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to refresh token', 
          status: tokenResponse.status,
          details: errorText
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const tokenData: XeroTokenResponse = await tokenResponse.json();
    console.log('Successfully refreshed Xero token');
    
    // Update tokens in Supabase
    const newExpiresAt = new Date();
    newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
    
    const { error: updateError } = await supabase
      .from('xero_credentials')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
      
    if (updateError) {
      console.error('Error updating tokens:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update tokens in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        refreshed: true,
        expires_at: newExpiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error refreshing token:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
