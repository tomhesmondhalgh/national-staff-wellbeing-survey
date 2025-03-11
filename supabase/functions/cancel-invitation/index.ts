
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Received request to cancel invitation')
    
    // Get request data
    const requestData = await req.json().catch(e => {
      console.error('Failed to parse request JSON:', e)
      return {}
    })
    
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
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to cancel invitation', success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
