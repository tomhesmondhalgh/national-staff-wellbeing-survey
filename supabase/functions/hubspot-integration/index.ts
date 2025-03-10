
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

    // We'll use both search and get by ID methods to ensure we find any existing contact
    let existingContact = await findContactByEmail(userData.email);

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
      try {
        // Attempt to create new contact with error handling for duplicates
        console.log('No existing contact found, attempting to create new contact in Hubspot');
        const contactResponse = await createContact(userData);
        
        // Check for conflict (409) which means the contact actually exists
        if (contactResponse.status === 409) {
          const errorData = await contactResponse.json();
          console.log('Contact already exists (409 conflict):', errorData);
          
          // Extract the existing ID from the error message if available
          const idMatch = errorData.message?.match(/Existing ID: (\d+)/);
          if (idMatch && idMatch[1]) {
            hubspotContactId = idMatch[1];
            console.log('Extracted existing contact ID from error:', hubspotContactId);
            
            // Now update this existing contact
            const updateResponse = await updateContact(hubspotContactId, userData);
            if (!updateResponse.ok) {
              console.error('Error updating existing contact after 409:', await updateResponse.json());
            } else {
              console.log('Successfully updated contact after 409 detection');
            }
          } else {
            console.error('Could not extract existing ID from 409 error', errorData);
            throw new Error(`Contact exists but could not determine ID: ${JSON.stringify(errorData)}`);
          }
        } else if (!contactResponse.ok) {
          // Handle other errors
          const errorData = await contactResponse.json();
          console.error('Error creating contact in Hubspot:', errorData);
          throw new Error(`Failed to create contact: ${JSON.stringify(errorData)}`);
        } else {
          // Contact created successfully
          const contactData = await contactResponse.json();
          hubspotContactId = contactData.id;
          console.log('Contact created in Hubspot with ID:', hubspotContactId);
        }
      } catch (createError) {
        console.error('Exception during contact creation/update:', createError);
        
        // If we got here but don't have a contact ID, try one more time to find by email
        if (!hubspotContactId) {
          console.log('Final attempt to find contact by email after error');
          existingContact = await findContactByEmail(userData.email);
          if (existingContact) {
            hubspotContactId = existingContact.id;
            console.log('Found contact on final attempt:', hubspotContactId);
          } else {
            throw createError;
          }
        }
      }
    }
    
    // If we still don't have a hubspot contact ID, we can't continue
    if (!hubspotContactId) {
      throw new Error('Failed to create or find Hubspot contact');
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
          properties: ['email', 'firstname', 'lastname'],
          limit: 1
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
      // Try an alternative approach - search with different conditions
      console.log('No results from primary search, trying alternative search');
      // Nothing found with the primary search method
      try {
        // Try getting the contact directly by email using the "get by email" endpoint
        const altResponse = await fetch(
          `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            }
          }
        );

        if (altResponse.ok) {
          const contactData = await altResponse.json();
          if (contactData && contactData.vid) {
            console.log('Found contact using alternative lookup:', contactData.vid);
            return { id: contactData.vid.toString() };
          }
        } else {
          console.log('Alternative contact lookup also returned no results (expected)');
        }
      } catch (altError) {
        console.error('Error in alternative contact lookup:', altError);
      }
      
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
