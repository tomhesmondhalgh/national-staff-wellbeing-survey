
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const HUBSPOT_API_KEY = Deno.env.get('HUBSPOT_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userData, listId } = await req.json();
    
    if (!userData || !userData.email) {
      throw new Error('Email is required');
    }

    console.log('Creating/updating contact in Hubspot:', userData);

    // Create or update contact in Hubspot
    const contactResponse = await createOrUpdateContact(userData);
    
    if (!contactResponse.ok) {
      const errorData = await contactResponse.json();
      console.error('Error creating contact in Hubspot:', errorData);
      throw new Error(`Failed to create contact: ${JSON.stringify(errorData)}`);
    }
    
    const contactData = await contactResponse.json();
    const hubspotContactId = contactData.id;
    console.log('Contact created/updated in Hubspot with ID:', hubspotContactId);
    
    // Add contact to list if listId is provided
    let listResult = null;
    if (listId) {
      console.log(`Adding contact ${hubspotContactId} to list ${listId}`);
      const listResponse = await addContactToList(hubspotContactId, listId);
      
      if (!listResponse.ok) {
        const errorData = await listResponse.json();
        console.error('Error adding contact to list:', errorData);
        throw new Error(`Failed to add contact to list: ${JSON.stringify(errorData)}`);
      }
      
      listResult = await listResponse.json();
      console.log('Contact added to list successfully:', listResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        contact: contactData,
        list: listResult
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in hubspot-integration function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function createOrUpdateContact(userData: any) {
  // Map user data to Hubspot properties format
  const properties = {
    email: userData.email,
    firstname: userData.firstName || '',
    lastname: userData.lastName || '',
    jobtitle: userData.jobTitle || '',
    company: userData.schoolName || '',
    address: userData.schoolAddress || '',
  };

  return fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
    },
    body: JSON.stringify({
      properties
    }),
  });
}

async function addContactToList(contactId: string, listId: string) {
  return fetch(`https://api.hubapi.com/contacts/v1/lists/${listId}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
    },
    body: JSON.stringify({
      vids: [contactId]
    }),
  });
}
