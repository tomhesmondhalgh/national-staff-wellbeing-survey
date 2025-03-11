
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';

type InviteMemberDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  organizationId: string;
};

export default function InviteMemberDialog({
  isOpen,
  onClose,
  onComplete,
  organizationId,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to send invitations');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a random token for the invitation
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      console.log(`Creating invitation for ${email} with role ${role} to organization ${organizationId}`);
      
      // Use a direct SQL query via RPC to avoid infinite recursion issues
      const { data, error } = await supabase.rpc('create_invitation', {
        user_email: email,
        org_id: organizationId,
        user_role: role,
        invitation_token: token,
        inviter_id: user.id,
        expiry_date: expiresAt.toISOString()
      });
      
      if (error) {
        console.error('Error creating invitation:', error);
        toast.error(`Failed to send invitation: ${error.message}`);
        return;
      }
      
      console.log('Invitation created successfully', data);
      
      // Try to call the edge function to send the email
      try {
        const orgName = currentOrganization?.name || 'the organization';
        
        const { error: functionError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            invitationId: data.id,
            organizationName: orgName
          }
        });
        
        if (functionError) {
          console.error('Error calling edge function:', functionError);
          // Don't block the invite creation if email fails
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Continue even if email sending fails
      }
      
      toast.success(`Invitation sent to ${email}`);
      
      // Close dialog and reset form
      onComplete();
      setEmail('');
      setRole('viewer');
      
    } catch (error: any) {
      console.error('Error in invitation process:', error);
      toast.error(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="organization_admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-brandPurple-500 hover:bg-brandPurple-600"
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
