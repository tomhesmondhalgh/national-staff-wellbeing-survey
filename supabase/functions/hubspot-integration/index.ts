
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

    console.log('Checking if contact exists in Hubspot:', userData.email);

    // Check if contact already exists to avoid duplicates
    const existingContact = await findContactByEmail(userData.email);

    let hubspotContactId;

    if (existingContact) {
      // Update existing contact
      console.log('Contact already exists in Hubspot with ID:', existingContact.id);
      const updateResponse = await updateContact(existingContact.id, userData);
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        console.error('Error updating contact in Hubspot:', errorData);
        throw new Error(`Failed to update contact: ${JSON.stringify(errorData)}`);
      }
      
      console.log('Successfully updated existing contact');
      hubspotContactId = existingContact.id;
    } else {
      // Create new contact
      console.log('Contact does not exist, creating new contact in Hubspot');
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
  console.log(`Searching for Hubspot contact with email: ${email}`);
  try {
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
      const errorText = await response.text();
      console.error('Error response from Hubspot search API:', errorText);
      console.error('HTTP Status:', response.status);
      return null;
    }

    const searchResult = await response.json();
    console.log('Search results count:', searchResult.total);
    
    if (searchResult.results && searchResult.results.length > 0) {
      console.log('Found existing contact:', searchResult.results[0].id);
      return searchResult.results[0];
    } else {
      console.log('No existing contact found with email:', email);
      return null;
    }
  } catch (error) {
    console.error('Exception in findContactByEmail:', error);
    return null; // Return null but don't throw to allow contact creation to proceed
  }
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

  console.log('Creating contact with properties:', JSON.stringify(properties));

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

  console.log(`Updating contact ${contactId} with properties:`, JSON.stringify(properties));

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
  console.log(`Adding contact ID ${contactId} to list ID ${listId}`);
  
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
