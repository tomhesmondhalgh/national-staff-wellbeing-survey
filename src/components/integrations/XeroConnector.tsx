
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuthState } from "@/hooks/useAuthState";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

type XeroStatus = {
  connected: boolean;
  connectedAt: string | null;
  tokenExpiresAt: number | null;
  currentTime: number;
};

const XeroConnector: React.FC = () => {
  const { session } = useAuthState();
  const [status, setStatus] = useState<XeroStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if token is expired
  const isTokenExpired = status?.tokenExpiresAt
    ? status.tokenExpiresAt < status.currentTime
    : true;

  // Format connected time
  const formatConnectedTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Check Xero connection status
  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Checking Xero connection status...');
      
      // Ensure we're using the correct authorization format
      const { data, error } = await supabase.functions.invoke('xero-auth', {
        body: { action: 'status' },
        method: 'POST',
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Error checking Xero status:', error);
        setError('Failed to check Xero connection status');
        toast.error('Error checking Xero status', {
          description: error.message,
        });
      } else {
        console.log('Received Xero status:', data);
        setStatus(data as XeroStatus);
      }
    } catch (err) {
      console.error('Exception checking Xero status:', err);
      setError('An unexpected error occurred');
      toast.error('Error checking Xero status');
    } finally {
      setLoading(false);
    }
  };

  // Connect to Xero
  const connectToXero = async () => {
    if (!session) {
      toast.error('You must be logged in to connect to Xero');
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      console.log('Initiating Xero connection...');
      
      // Calculate dynamic redirect URI based on current URL
      // Use a path that our edge function can handle
      const redirectUri = `${window.location.origin}/xero-callback`;
      const state = crypto.randomUUID(); // Generate a unique state for security
      
      const { data, error } = await supabase.functions.invoke('xero-auth', {
        body: { 
          action: 'authorize',
          redirectUri,
          state
        },
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Error connecting to Xero:', error);
        setError('Failed to initiate Xero connection');
        toast.error('Error connecting to Xero', {
          description: error.message,
        });
      } else if (data?.url) {
        console.log('Redirecting to Xero authorization URL:', data.url);
        // Store state in localStorage for verification when the user returns
        localStorage.setItem('xero_auth_state', state);
        // Open Xero authorization in same window
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Exception connecting to Xero:', err);
      setError('An unexpected error occurred');
      toast.error('Error connecting to Xero');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from Xero
  const disconnectFromXero = async () => {
    if (!session) {
      toast.error('You must be logged in to disconnect from Xero');
      return;
    }
    
    setDisconnecting(true);
    setError(null);
    
    try {
      console.log('Disconnecting from Xero...');
      const { data, error } = await supabase.functions.invoke('xero-auth', {
        body: { action: 'disconnect' },
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Error disconnecting from Xero:', error);
        setError('Failed to disconnect from Xero');
        toast.error('Error disconnecting from Xero', {
          description: error.message,
        });
      } else {
        console.log('Successfully disconnected from Xero');
        toast.success('Successfully disconnected from Xero');
        // Refresh status
        checkStatus();
      }
    } catch (err) {
      console.error('Exception disconnecting from Xero:', err);
      setError('An unexpected error occurred');
      toast.error('Error disconnecting from Xero');
    } finally {
      setDisconnecting(false);
    }
  };

  // Check for callback parameters in URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const storedState = localStorage.getItem('xero_auth_state');
    
    // If code and state are present, this is a callback from Xero
    if (code && state) {
      console.log('Detected Xero callback with authorization code');
      
      // Verify state to prevent CSRF attacks
      if (state !== storedState) {
        console.error('State verification failed - potential CSRF attack');
        toast.error('Security verification failed', {
          description: 'Authentication attempt could not be verified.'
        });
        return;
      }
      
      // Process the callback by exchanging the code for tokens
      if (session) {
        (async () => {
          setLoading(true);
          try {
            const { data, error } = await supabase.functions.invoke('xero-auth', {
              body: { 
                action: 'callback',
                code,
                state,
                redirectUri: `${window.location.origin}/xero-callback`
              },
              method: 'POST',
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (error) {
              console.error('Error processing Xero callback:', error);
              toast.error('Failed to complete Xero connection');
            } else {
              console.log('Successfully connected to Xero:', data);
              toast.success('Successfully connected to Xero', {
                description: 'Your Xero account has been linked to your profile.'
              });
              // Clear the state from localStorage
              localStorage.removeItem('xero_auth_state');
            }
          } catch (err) {
            console.error('Exception processing Xero callback:', err);
            toast.error('Error connecting to Xero');
          } finally {
            setLoading(false);
            // Check status to update UI
            checkStatus();
            // Remove the query parameters from the URL to prevent issues on page refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })();
      }
    } else {
      // Normal load, just check the status
      if (session) {
        checkStatus();
      }
    }
  }, [session]);

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Xero Integration</CardTitle>
          <CardDescription>Connect your Xero account to integrate with your accounting system.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>You must be logged in to connect to Xero.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Xero Integration
          {status?.connected && (
            <Badge 
              variant={isTokenExpired ? "destructive" : "default"}
              className="ml-2"
            >
              {isTokenExpired ? "Token Expired" : "Connected"}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Connect your Xero account to integrate with your accounting system.</CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-destructive py-2">
            <XCircle className="inline-block mr-2" size={16} />
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <span className="font-medium mr-2">Connection Status:</span>
                {status?.connected ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="inline-block mr-1" size={16} />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <XCircle className="inline-block mr-1" size={16} />
                    Not Connected
                  </span>
                )}
              </div>
              
              {status?.connected && (
                <>
                  <div>
                    <span className="font-medium">Connected Since:</span>{" "}
                    {formatConnectedTime(status.connectedAt)}
                  </div>
                  
                  <div>
                    <span className="font-medium">Token Status:</span>{" "}
                    {isTokenExpired ? (
                      <span className="text-destructive">Expired</span>
                    ) : (
                      <span className="text-green-600">Valid</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {status?.connected ? (
          <Button
            variant="destructive"
            onClick={disconnectFromXero}
            disabled={disconnecting || loading}
          >
            {disconnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect from Xero
          </Button>
        ) : (
          <Button
            onClick={connectToXero}
            disabled={connecting || loading}
            className="flex items-center"
          >
            {connecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Connect to Xero
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={checkStatus}
          disabled={loading || connecting || disconnecting}
        >
          Refresh Status
        </Button>
      </CardFooter>
    </Card>
  );
};

export default XeroConnector;
