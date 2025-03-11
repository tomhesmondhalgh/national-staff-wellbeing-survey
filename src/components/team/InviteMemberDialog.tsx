
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useOrganization } from '../../contexts/OrganizationContext';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a random token for the invitation
      const token = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
      
      console.log(`Creating invitation for ${email} with role ${role} to organization ${organizationId}`);
      
      // Insert the invitation into the database
      const { data, error } = await supabase
        .from('invitations')
        .insert({
          email: email,
          organization_id: organizationId,
          role: role,
          token: token,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating invitation:', error);
        toast.error(`Failed to send invitation: ${error.message}`);
        return;
      }
      
      console.log('Invitation created successfully:', data);
      
      // Send an email notification (this would be handled by a Supabase edge function)
      const orgName = currentOrganization?.name || 'the organization';
      
      toast.success(`Invitation sent to ${email}`);
      
      // Wait a moment before completing to ensure database consistency
      setTimeout(() => {
        onComplete();
        setEmail('');
        setRole('viewer');
      }, 500);
      
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
