
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Xero Token URL
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  id_token?: string;
  refresh_token: string;
  scope: string;
  token_type: string;
}

async function refreshXeroToken(refreshToken: string): Promise<XeroTokenResponse> {
  console.log('Refreshing Xero token');
  
  if (!xeroClientId || !xeroClientSecret) {
    throw new Error('Missing required Xero API credentials');
  }
  
  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${xeroClientId}:${xeroClientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', response.status, errorText);
    throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
  }
  
  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Request URL:', req.url);
    
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
    
    // Verify authentication
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

    // Get current credentials
    const { data: credentials, error: credentialsError } = await supabase
      .from('xero_credentials')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
      
    if (credentialsError) {
      console.error('Credentials retrieval error:', credentialsError);
      return new Response(
        JSON.stringify({ error: 'Error retrieving Xero credentials', details: credentialsError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!credentials) {
      console.log('No Xero credentials found');
      return new Response(
        JSON.stringify({ error: 'No Xero credentials found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = new Date(credentials.expires_at);
    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (expiresAt.getTime() - now.getTime() > fiveMinutes) {
      // Token is still valid
      return new Response(
        JSON.stringify({ 
          refreshed: false,
          message: 'Token is still valid',
          expires_at: credentials.expires_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Refresh the token
    try {
      const tokenData = await refreshXeroToken(credentials.refresh_token);
      
      // Update stored tokens
      const newExpiresAt = new Date();
      newExpiresAt.setSeconds(newExpiresAt.getSeconds() + tokenData.expires_in);
      
      const { error: updateError } = await supabase
        .from('xero_credentials')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: newExpiresAt.toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);
        
      if (updateError) {
        console.error('Token update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update tokens', details: updateError }),
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
      console.error('Token refresh error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
