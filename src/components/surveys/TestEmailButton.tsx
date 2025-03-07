
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";

interface TestEmailButtonProps {
  email: string;
}

const TestEmailButton: React.FC<TestEmailButtonProps> = ({ email }) => {
  const [isSending, setIsSending] = useState<string | null>(null);

  const sendTestEmail = async (type: 'survey' | 'analysis' | 'closure') => {
    try {
      setIsSending(type);
      
      const { data, error } = await supabase.functions.invoke('send-test-emails', {
        body: {
          email,
          type
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log(`${type} test email result:`, data);
      
      toast.success(`Test ${type} email sent`, {
        description: `A test ${type} email has been sent to ${email}`
      });
    } catch (error) {
      console.error(`Error sending test ${type} email:`, error);
      toast.error(`Failed to send test ${type} email`, {
        description: "There was a problem sending the test email. Please try again."
      });
    } finally {
      setIsSending(null);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 mb-2">Send Test Emails</h3>
      <p className="text-sm text-gray-600 mb-4">
        Send test versions of each email type to: {email}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={() => sendTestEmail('survey')}
          disabled={!!isSending}
          className="flex items-center"
        >
          {isSending === 'survey' ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Test Survey Invite
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => sendTestEmail('analysis')}
          disabled={!!isSending}
          className="flex items-center"
        >
          {isSending === 'analysis' ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Test Analysis Report
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => sendTestEmail('closure')}
          disabled={!!isSending}
          className="flex items-center"
        >
          {isSending === 'closure' ? (
            <span className="animate-pulse">Sending...</span>
          ) : (
            <>
              <Send size={16} className="mr-2" />
              Test Closure Notice
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default TestEmailButton;
