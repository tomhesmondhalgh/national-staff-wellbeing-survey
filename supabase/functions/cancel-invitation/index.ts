
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

interface RequestParams {
  invitationId: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Received OPTIONS request, returning CORS headers')
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('=== START: cancel-invitation function execution ===')
  console.log('Request method:', req.method)
  console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())))

  try {
    console.log('Received request to cancel invitation')
    
    let requestData: any = {}
    try {
      requestData = await req.json()
      console.log('Successfully parsed request JSON:', JSON.stringify(requestData))
    } catch (e) {
      console.error('Failed to parse request JSON:', e)
    }
    
    const { invitationId } = requestData as RequestParams
    console.log('Invitation ID to cancel:', invitationId)

    if (!invitationId) {
      console.error('Missing invitation ID in request')
      return new Response(
        JSON.stringify({ error: 'Invitation ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL available:', !!supabaseUrl)
    console.log('Supabase Service Role Key available:', !!supabaseServiceKey)
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase URL or service role key')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('Creating Supabase client with service role')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute the query with admin privileges
    console.log('Attempting to delete invitation with ID:', invitationId)
    const { data, error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .select()

    if (error) {
      console.error('Error deleting invitation:', error)
      throw error
    }

    console.log('Successfully deleted invitation:', data)
    console.log('=== END: cancel-invitation function execution ===')
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    console.log('=== END: cancel-invitation function execution with error ===')
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to cancel invitation', success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
