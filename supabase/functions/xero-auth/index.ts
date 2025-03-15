
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

// Xero OAuth URLs
const XERO_AUTH_URL = 'https://login.xero.com/identity/connect/authorize';
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
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Check authorization for non-public endpoints
    if (action !== 'callback') {
      const token = req.headers.get('Authorization')?.split('Bearer ')[1];
      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the token (simplified - in production, use proper JWT verification)
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
        .single();

      if (rolesError || !roles || roles.role !== 'administrator') {
        console.error('Admin check error:', rolesError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Main routes for OAuth flow
    switch (action) {
      case 'authorize': {
        // Generate OAuth URL for Xero authorization
        const redirectUri = `${url.origin}/xero-auth/callback`;
        const state = crypto.randomUUID(); // Generate a random state for security
        
        // Store state for validation during callback
        const { error: stateError } = await supabase
          .from('xero_oauth_states')
          .insert({ state, created_at: new Date().toISOString() });
          
        if (stateError) {
          console.error('State storage error:', stateError);
          return new Response(
            JSON.stringify({ error: 'Failed to initialize OAuth flow' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const queryParams = new URLSearchParams({
          response_type: 'code',
          client_id: xeroClientId,
          redirect_uri: redirectUri,
          scope: 'openid profile email accounting.transactions offline_access',
          state
        });
        
        const authUrl = `${XERO_AUTH_URL}?${queryParams.toString()}`;
        
        return new Response(
          JSON.stringify({ url: authUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'callback': {
        // Handle the OAuth callback from Xero
        const params = url.searchParams;
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        
        if (error) {
          console.error('Xero auth error:', error);
          // Redirect to error page
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${url.origin}/admin?xerror=${error}`
            }
          });
        }
        
        if (!code || !state) {
          console.error('Missing code or state');
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${url.origin}/admin?xerror=missing_params`
            }
          });
        }
        
        // Verify the state parameter
        const { data: stateData, error: stateError } = await supabase
          .from('xero_oauth_states')
          .select()
          .eq('state', state)
          .single();
          
        if (stateError || !stateData) {
          console.error('Invalid state:', stateError);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${url.origin}/admin?xerror=invalid_state`
            }
          });
        }
        
        // Delete the used state
        await supabase
          .from('xero_oauth_states')
          .delete()
          .eq('state', state);
        
        // Exchange the code for tokens
        const redirectUri = `${url.origin}/xero-auth/callback`;
        const tokenResponse = await fetch(XERO_TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${xeroClientId}:${xeroClientSecret}`)}`
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri
          })
        });
        
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.text();
          console.error('Token exchange error:', errorData);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${url.origin}/admin?xerror=token_exchange_failed`
            }
          });
        }
        
        const tokenData: XeroTokenResponse = await tokenResponse.json();
        
        // Store tokens in Supabase
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
        
        const { error: tokenStoreError } = await supabase
          .from('xero_credentials')
          .upsert({
            id: 1, // Using a single row for simplicity
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt.toISOString(),
            token_type: tokenData.token_type,
            scope: tokenData.scope,
            updated_at: new Date().toISOString()
          });
          
        if (tokenStoreError) {
          console.error('Token storage error:', tokenStoreError);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': `${url.origin}/admin?xerror=token_storage_failed`
            }
          });
        }
        
        // Redirect back to admin page with success
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': `${url.origin}/admin?xero=connected`
          }
        });
      }
      
      case 'status': {
        // Check if Xero is connected
        const { data: xeroData, error: xeroError } = await supabase
          .from('xero_credentials')
          .select('updated_at, expires_at')
          .eq('id', 1)
          .single();
          
        if (xeroError) {
          console.error('Xero status check error:', xeroError);
          return new Response(
            JSON.stringify({ connected: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            connected: !!xeroData,
            last_updated: xeroData?.updated_at,
            expires_at: xeroData?.expires_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'disconnect': {
        // Disconnect Xero by removing credentials
        const { error: disconnectError } = await supabase
          .from('xero_credentials')
          .delete()
          .eq('id', 1);
          
        if (disconnectError) {
          console.error('Xero disconnect error:', disconnectError);
          return new Response(
            JSON.stringify({ error: 'Failed to disconnect Xero' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Xero auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
