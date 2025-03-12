
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateInvoiceRequest {
  paymentId: string;
  status: 'pending' | 'completed' | 'cancelled';
  adminUserId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with admin permissions
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is an admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'administrator')
      .maybeSingle();
      
    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { paymentId, status, adminUserId }: UpdateInvoiceRequest = await req.json();

    if (!paymentId || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update payment history record
    const { data: payment, error: paymentError } = await supabase
      .from('payment_history')
      .update({
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('payment_method', 'invoice')
      .select('subscription_id')
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // If payment is marked as completed, update the subscription status
    if (status === 'completed' && payment?.subscription_id) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_type, purchase_type, user_id')
        .eq('id', payment.subscription_id)
        .single();

      if (subscriptionError) {
        throw subscriptionError;
      }

      // Update subscription to active
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          start_date: new Date().toISOString(),
          // Set end_date to 3 years from now for both one-time and subscription plans
          // since this is manually managed
          end_date: subscription.purchase_type === 'one-time' 
            ? new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', payment.subscription_id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: `Invoice status updated to ${status}` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error updating invoice status' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
