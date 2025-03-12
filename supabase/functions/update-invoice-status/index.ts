
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
  invoiceNumber?: string;
  adminUserId: string;
}

interface CreateInvoiceRequest {
  planType: 'foundation' | 'progress' | 'premium';
  purchaseType: 'subscription' | 'one-time';
  billingDetails: {
    schoolName: string;
    address: string;
    contactName: string;
    contactEmail: string;
    purchaseOrderNumber?: string;
    additionalInformation?: string;
  };
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

    // Parse request body
    const requestData = await req.json();
    
    // Check if this is an admin updating an invoice status
    if ('paymentId' in requestData && 'status' in requestData) {
      return handleUpdateInvoiceStatus(requestData, user, supabase);
    }
    
    // Or if it's a user creating a new invoice request
    else if ('planType' in requestData && 'purchaseType' in requestData) {
      return handleCreateInvoiceRequest(requestData, user, supabase);
    }
    
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in update-invoice-status function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error processing request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handle admin updating an invoice status
async function handleUpdateInvoiceStatus(
  data: UpdateInvoiceRequest, 
  user: any,
  supabase: any
) {
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

  const { paymentId, status, invoiceNumber, adminUserId } = data;

  if (!paymentId || !status) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Prepare update data
  const updateData: any = {
    payment_status: status,
    updated_at: new Date().toISOString()
  };
  
  // Only add invoice_number to the update if it was provided
  if (invoiceNumber !== undefined) {
    updateData.invoice_number = invoiceNumber;
  }

  // Update payment history record
  const { data: payment, error: paymentError } = await supabase
    .from('payment_history')
    .update(updateData)
    .eq('id', paymentId)
    .eq('payment_method', 'invoice')
    .select('subscription_id')
    .single();

  if (paymentError) {
    return new Response(
      JSON.stringify({ error: paymentError.message || 'Error updating payment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // If payment is marked as completed, update the subscription status
  if (status === 'completed' && payment?.subscription_id) {
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_type, purchase_type, user_id')
      .eq('id', payment.subscription_id)
      .single();

    if (subscriptionError) {
      return new Response(
        JSON.stringify({ error: subscriptionError.message || 'Error fetching subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: updateError.message || 'Error updating subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: `Invoice status updated to ${status}` }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle user creating a new invoice request
async function handleCreateInvoiceRequest(
  data: CreateInvoiceRequest,
  user: any,
  supabase: any
) {
  const { planType, purchaseType, billingDetails } = data;
  
  // Get pricing based on plan type
  const planPricing = {
    foundation: 299,
    progress: 1499,
    premium: 2499
  };
  
  const amount = planPricing[planType] || 299;
  
  // Create a subscription record with payment_method 'invoice'
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: user.id,
      plan_type: planType,
      status: 'pending',
      payment_method: 'invoice',
      purchase_type: purchaseType,
    })
    .select()
    .single();

  if (subscriptionError) {
    console.error('Error creating subscription:', subscriptionError);
    return new Response(
      JSON.stringify({ error: 'Failed to create subscription record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Add billing details to payment_history without an invoice number
  const { data: payment, error: paymentError } = await supabase
    .from('payment_history')
    .insert({
      subscription_id: subscription.id,
      payment_method: 'invoice',
      amount: amount,
      currency: 'GBP',
      payment_status: 'pending',
      billing_school_name: billingDetails.schoolName,
      billing_address: billingDetails.address,
      billing_contact_name: billingDetails.contactName,
      billing_contact_email: billingDetails.contactEmail,
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment record:', paymentError);
    return new Response(
      JSON.stringify({ error: 'Failed to create payment record' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Invoice request submitted successfully',
      subscription: subscription.id,
      payment: payment.id
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
