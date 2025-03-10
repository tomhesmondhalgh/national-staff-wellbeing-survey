
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
    console.log('Hubspot integration function called');
    
    const requestBody = await req.json();
    const { userData, listId } = requestBody;
    
    console.log('Request payload:', JSON.stringify({ 
      userData: { ...userData, email: userData.email ? userData.email : 'email missing' }, 
      listId 
    }));
    
    if (!userData || !userData.email) {
      console.error('Email is required but missing in request');
      throw new Error('Email is required');
    }

    console.log('Creating/updating contact in Hubspot:', userData);

    // Check if contact already exists to avoid duplicates
    const existingContact = await findContactByEmail(userData.email);

    let hubspotContactId;

    if (existingContact) {
      // Update existing contact
      console.log('Contact already exists in Hubspot, updating:', existingContact.id);
      const updateResponse = await updateContact(existingContact.id, userData);
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Error updating contact in Hubspot:', errorData);
        throw new Error(`Failed to update contact: ${JSON.stringify(errorData)}`);
      }
      
      hubspotContactId = existingContact.id;
    } else {
      // Create new contact
      console.log('Creating new contact in Hubspot');
      const contactResponse = await createContact(userData);
      
      if (!contactResponse.ok) {
        const errorData = await contactResponse.json();
        console.error('Error creating contact in Hubspot:', errorData);
        throw new Error(`Failed to create contact: ${JSON.stringify(errorData)}`);
      }
      
      const contactData = await contactResponse.json();
      hubspotContactId = contactData.id;
      console.log('Contact created in Hubspot with ID:', hubspotContactId);
    }
    
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
        contact: { id: hubspotContactId },
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

async function findContactByEmail(email: string) {
  const response = await fetch(
    `https://api.hubapi.com/crm/v3/objects/contacts/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: email
              }
            ]
          }
        ],
        properties: ['email', 'firstname', 'lastname']
      }),
    }
  );

  if (!response.ok) {
    console.log('Error searching for contact:', await response.text());
    return null;
  }

  const searchResult = await response.json();
  return searchResult.results && searchResult.results.length > 0 
    ? searchResult.results[0] 
    : null;
}

async function createContact(userData: any) {
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

async function updateContact(contactId: string, userData: any) {
  // Map user data to Hubspot properties format
  const properties = {
    firstname: userData.firstName || '',
    lastname: userData.lastName || '',
    jobtitle: userData.jobTitle || '',
    company: userData.schoolName || '',
    address: userData.schoolAddress || '',
  };

  return fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
    method: 'PATCH',
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
