
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, RefreshCw, LinkIcon, Unlink } from 'lucide-react';

export function XeroIntegration() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDisconnecting, setIsDisconnecting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const checkConnectionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      
      console.log('Checking Xero connection status...');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('xero-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { action: 'status' }
      });
      
      if (fnError) {
        console.error('Error checking Xero connection:', fnError);
        setError(`Failed to check connection: ${fnError.message}`);
        setDetailedError(JSON.stringify(fnError, null, 2));
        toast.error('Failed to check Xero connection status');
        return;
      }
      
      console.log('Xero connection status response:', data);
      setIsConnected(data.connected);
      setLastUpdated(data.last_updated);
      setExpiresAt(data.expires_at);
    } catch (error) {
      console.error('Error checking Xero connection:', error);
      setError(`Exception checking connection: ${error.message || 'Unknown error'}`);
      setDetailedError(JSON.stringify(error, null, 2));
      toast.error('Failed to check Xero connection status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setDetailedError(null);
      
      console.log('Starting Xero connection process...');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('xero-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { action: 'authorize' }
      });
      
      if (fnError) {
        console.error('Error starting Xero connection:', fnError);
        setError(`Failed to start connection: ${fnError.message}`);
        setDetailedError(JSON.stringify(fnError, null, 2));
        toast.error('Failed to connect to Xero');
        return;
      }

      if (!data || !data.url) {
        console.error('Invalid response from Xero auth function:', data);
        setError('Invalid response from server - missing URL');
        setDetailedError(JSON.stringify(data, null, 2));
        toast.error('Failed to connect to Xero - invalid response');
        return;
      }

      console.log('Redirecting to Xero authorization page:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setError(`Exception during connection: ${error.message || 'Unknown error'}`);
      setDetailedError(JSON.stringify(error, null, 2));
      toast.error('Failed to connect to Xero');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      setError(null);
      
      console.log('Disconnecting from Xero...');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('xero-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: { action: 'disconnect' }
      });

      if (fnError) {
        console.error('Error disconnecting Xero:', fnError);
        setError(`Failed to disconnect: ${fnError.message}`);
        toast.error('Failed to disconnect from Xero');
        return;
      }

      toast.success('Successfully disconnected from Xero');
      setIsConnected(false);
      setLastUpdated(null);
      setExpiresAt(null);
    } catch (error) {
      console.error('Error disconnecting from Xero:', error);
      setError(`Exception during disconnection: ${error.message || 'Unknown error'}`);
      toast.error('Failed to disconnect from Xero');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log('Refreshing Xero token...');
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const { data, error: fnError } = await supabase.functions.invoke('xero-token-refresh', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (fnError) {
        console.error('Error refreshing Xero token:', fnError);
        setError(`Failed to refresh token: ${fnError.message}`);
        toast.error('Failed to refresh Xero token');
        return;
      }

      if (data.refreshed) {
        toast.success('Successfully refreshed Xero token');
        setExpiresAt(data.expires_at);
        setLastUpdated(new Date().toISOString());
      } else {
        toast.info(data.message);
      }
    } catch (error) {
      console.error('Error refreshing Xero token:', error);
      setError(`Exception during token refresh: ${error.message || 'Unknown error'}`);
      toast.error('Failed to refresh Xero token');
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const isTokenExpired = () => {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    return expiry < new Date();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Xero Integration</CardTitle>
            <CardDescription>
              Connect with Xero to create and manage invoices directly from the admin dashboard
            </CardDescription>
          </div>
          {isConnected && (
            <Badge variant={isTokenExpired() ? "destructive" : "success"} className="text-xs">
              {isTokenExpired() ? 'Token Expired' : 'Connected'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : isConnected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{lastUpdated ? formatDate(lastUpdated) : 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Token Expires</p>
                <p className="font-medium">
                  {expiresAt ? formatDate(expiresAt) : 'Unknown'}
                  {isTokenExpired() && (
                    <span className="ml-2 text-destructive text-xs">(Expired)</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Integration Info</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Your Xero connection is active. You can now search for companies and create invoices directly from
                      the Purchases management page.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {detailedError && (
              <div className="rounded-md bg-slate-100 p-4 mt-2">
                <h4 className="text-sm font-medium mb-2">Technical Details</h4>
                <pre className="text-xs overflow-auto max-h-[200px] p-2 bg-slate-200 rounded">
                  {detailedError}
                </pre>
              </div>
            )}
            
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">Not Connected</h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      You'll need to connect to Xero before you can use invoice integration features.
                      Click "Connect to Xero" to authorize this application.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Setup Requirements</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Ensure your Xero application is properly configured with the correct redirect URL:
                      <br />
                      <code className="text-xs bg-blue-100 p-1 rounded">
                        {window.location.origin}/functions/v1/xero-auth/callback
                      </code>
                    </p>
                    <p className="mt-2">
                      Current project URL: <code className="text-xs bg-blue-100 p-1 rounded">{window.location.origin}</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {isConnected ? (
          <>
            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              {isDisconnecting ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Disconnecting...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Unlink className="h-4 w-4" />
                  Disconnect from Xero
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleRefreshToken}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Refreshing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Token
                </span>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="outline"
              onClick={checkConnectionStatus}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Status Check
            </Button>
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  Connect to Xero
                </span>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
