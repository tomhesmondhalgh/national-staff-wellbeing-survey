
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Xero OAuth endpoints
const XERO_AUTHORIZATION_URL = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'

type XeroTokenResponse = {
  id_token: string
  access_token: string
  expires_in: number
  token_type: string
  refresh_token: string
  scope: string
}

serve(async (req) => {
  console.log(`[xero-auth] Request received: ${req.method} ${req.url}`)
  console.log(`[xero-auth] Authorization header: ${req.headers.has('Authorization') ? 'Present' : 'Missing'}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[xero-auth] Handling CORS preflight request')
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    // Parse request body if it exists
    let requestData = {}
    if (req.method === 'POST') {
      try {
        // Make a copy of the request to read its body
        const clonedReq = req.clone()
        const body = await clonedReq.text()
        console.log(`[xero-auth] Request body: ${body}`)
        
        if (body) {
          requestData = JSON.parse(body)
        }
      } catch (err) {
        console.error('[xero-auth] Error parsing request body:', err)
      }
    }
    console.log('[xero-auth] Request data:', requestData)
    
    // Get URL and parameters
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || (requestData as any).action
    
    console.log('[xero-auth] Action:', action)
    
    // Create Supabase client using env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[xero-auth] Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('[xero-auth] Creating Supabase client')
    
    // Extract the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization') || ''
    console.log(`[xero-auth] Auth header format: ${authHeader.substring(0, 15)}...`)
    
    // Create a Supabase client with the authorization header
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        }
      }
    )
    
    // Get authentication status and user
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()

    if (sessionError) {
      console.error('[xero-auth] Authentication error:', sessionError)
      return new Response(
        JSON.stringify({ error: 'Not authenticated', details: sessionError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!session) {
      console.error('[xero-auth] No session found')
      return new Response(
        JSON.stringify({ error: 'Not authenticated', details: 'No session found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('[xero-auth] Authenticated user:', session.user.id)
    
    // Get Xero credentials
    const clientId = Deno.env.get('XERO_CLIENT_ID')
    const clientSecret = Deno.env.get('XERO_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.error('[xero-auth] Missing Xero credentials')
      return new Response(
        JSON.stringify({ error: 'Xero credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle different actions
    switch (action) {
      case 'authorize': {
        console.log('[xero-auth] Processing authorize request')
        
        // Get redirect URI from request data or set default
        const redirectUri = (requestData as any).redirectUri || 
          `${url.origin}/api/rest/xero-auth?action=callback`
        
        // Create state parameter for security (preventing CSRF)
        const state = crypto.randomUUID()
        
        // Create random code verifier for PKCE
        const codeVerifier = crypto.randomUUID() + crypto.randomUUID()
        
        // Store code verifier in user metadata
        await supabaseClient
          .from('profiles')
          .update({ 
            xero_auth_state: state,
            xero_code_verifier: codeVerifier,
            xero_redirect_uri: redirectUri
          })
          .eq('id', session.user.id)
        
        // Create code challenge (SHA-256 hash of verifier, Base64 URL encoded)
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await crypto.subtle.digest('SHA-256', data)
        
        // Convert to Base64URL format
        const base64Digest = btoa(String.fromCharCode(...new Uint8Array(digest)))
          .replace(/=/g, '')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
        
        // Construct authorization URL
        const authorizationUrl = new URL(XERO_AUTHORIZATION_URL)
        authorizationUrl.searchParams.append('response_type', 'code')
        authorizationUrl.searchParams.append('client_id', clientId)
        authorizationUrl.searchParams.append('redirect_uri', redirectUri)
        authorizationUrl.searchParams.append('scope', 'openid offline_access accounting.transactions accounting.settings')
        authorizationUrl.searchParams.append('state', state)
        authorizationUrl.searchParams.append('code_challenge', base64Digest)
        authorizationUrl.searchParams.append('code_challenge_method', 'S256')
        
        console.log(`[xero-auth] Generated authorization URL (redirecting user to Xero): ${authorizationUrl}`)
        
        return new Response(
          JSON.stringify({ url: authorizationUrl.toString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'callback': {
        console.log('[xero-auth] Processing OAuth callback')
        
        // Get authorization code and state from URL params
        const code = url.searchParams.get('code')
        const returnedState = url.searchParams.get('state')
        
        if (!code) {
          const error = url.searchParams.get('error')
          const errorDescription = url.searchParams.get('error_description')
          console.error(`[xero-auth] Authorization error: ${error} - ${errorDescription}`)
          
          return new Response(
            JSON.stringify({ 
              error: 'Authorization failed', 
              details: { error, description: errorDescription } 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Get user's stored state and code verifier
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('xero_auth_state, xero_code_verifier, xero_redirect_uri')
          .eq('id', session.user.id)
          .single()
        
        if (profileError || !profile) {
          console.error('[xero-auth] Failed to retrieve auth state:', profileError)
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve auth state', details: profileError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Verify state to prevent CSRF
        if (returnedState !== profile.xero_auth_state) {
          console.error('[xero-auth] State mismatch - potential CSRF attack')
          return new Response(
            JSON.stringify({ error: 'State verification failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        console.log('[xero-auth] State verification successful')
        
        // Exchange code for tokens
        try {
          // Prepare token request body
          const params = new URLSearchParams()
          params.append('grant_type', 'authorization_code')
          params.append('code', code)
          params.append('redirect_uri', profile.xero_redirect_uri)
          params.append('code_verifier', profile.xero_code_verifier)
          
          // Create Basic auth header for client authentication
          const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`)
          
          console.log('[xero-auth] Exchanging code for tokens')
          
          // Make token request
          const tokenResponse = await fetch(XERO_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          })
          
          // Check response status
          if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text()
            console.error(`[xero-auth] Token request failed: ${tokenResponse.status} ${errorData}`)
            
            return new Response(
              JSON.stringify({ 
                error: 'Failed to exchange code for tokens', 
                status: tokenResponse.status,
                details: errorData
              }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // Parse token response
          const tokenData = await tokenResponse.json() as XeroTokenResponse
          console.log('[xero-auth] Successfully received tokens')
          
          // Calculate token expiry time
          const expiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in
          
          // Store tokens in user's profile
          await supabaseClient
            .from('profiles')
            .update({
              xero_access_token: tokenData.access_token,
              xero_refresh_token: tokenData.refresh_token,
              xero_token_expires_at: expiresAt,
              xero_connected: true,
              xero_connected_at: new Date().toISOString()
            })
            .eq('id', session.user.id)
          
          console.log('[xero-auth] Tokens stored successfully')
          
          // Return success response with redirection URL
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'Xero connected successfully'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('[xero-auth] Token exchange error:', error)
          return new Response(
            JSON.stringify({ error: 'Token exchange failed', details: error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      case 'status': {
        console.log('[xero-auth] Checking connection status')
        
        // Retrieve user's Xero connection status
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('xero_connected, xero_connected_at, xero_token_expires_at')
          .eq('id', session.user.id)
          .single()
        
        if (profileError) {
          console.error('[xero-auth] Failed to retrieve connection status:', profileError)
          return new Response(
            JSON.stringify({ error: 'Failed to retrieve connection status', details: profileError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        return new Response(
          JSON.stringify({
            connected: profile?.xero_connected || false,
            connectedAt: profile?.xero_connected_at || null,
            tokenExpiresAt: profile?.xero_token_expires_at || null,
            currentTime: Math.floor(Date.now() / 1000)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      case 'disconnect': {
        console.log('[xero-auth] Disconnecting from Xero')
        
        // Clear Xero connection data
        await supabaseClient
          .from('profiles')
          .update({
            xero_access_token: null,
            xero_refresh_token: null,
            xero_token_expires_at: null,
            xero_connected: false,
            xero_connected_at: null,
            xero_auth_state: null,
            xero_code_verifier: null,
            xero_redirect_uri: null
          })
          .eq('id', session.user.id)
        
        console.log('[xero-auth] Successfully disconnected from Xero')
        
        return new Response(
          JSON.stringify({ success: true, message: 'Successfully disconnected from Xero' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      default: {
        console.error(`[xero-auth] Unknown action: ${action}`)
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  } catch (error) {
    console.error('[xero-auth] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
