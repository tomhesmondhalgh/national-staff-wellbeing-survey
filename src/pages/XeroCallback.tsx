
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Loader2 } from 'lucide-react';

const XeroCallback: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // The actual callback processing is done in the XeroConnector component
    // This component just redirects back to the Xero integration page
    const timeoutId = setTimeout(() => {
      navigate('/xero');
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [navigate]);
  
  return (
    <MainLayout>
      <div className="container mx-auto py-20 px-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
        <h1 className="text-2xl font-bold mb-2">Processing Xero Connection</h1>
        <p className="text-muted-foreground">
          Finalising your Xero connection. Please wait...
        </p>
      </div>
    </MainLayout>
  );
};

export default XeroCallback;
