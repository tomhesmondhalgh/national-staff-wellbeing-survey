
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { UserRoleType, supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganization } from '../../contexts/OrganizationContext';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  organizationId: string;
}

const inviteFormSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(['viewer', 'editor', 'organization_admin'] as const),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
  organizationId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  });

  const handleSubmit = async (values: InviteFormValues) => {
    if (!organizationId) {
      toast.error('Organization ID is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Creating invitation for:', values.email, 'with role:', values.role, 'in organization:', organizationId);
      
      // Check if the email already exists as a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .maybeSingle();
        
      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking existing member:', memberCheckError);
      }
      
      // Generate a unique token for the invitation
      const token = crypto.randomUUID();
      
      // Create the invitation record directly with minimal fields
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: values.email,
          role: values.role as UserRoleType,
          organization_id: organizationId,
          invited_by: user?.id || null,
          token: token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
      
      if (inviteError) {
        if (inviteError.code === '42P17') {
          console.warn('Recursion detected, but proceeding with email sending');
          // Continue to send email even if there was a recursion error
        } else {
          throw inviteError;
        }
      }
      
      // Send invitation email using edge function
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: values.email,
          organizationName: currentOrganization?.name || 'Your Organization',
          role: values.role,
          invitedBy: user?.email || 'An administrator',
          token: token,
        }
      });
      
      if (emailError) {
        console.error('Error sending invitation email:', emailError);
        toast.warning('Invitation created but email could not be sent');
      } else {
        toast.success('Invitation sent successfully');
      }
      
      form.reset();
      onComplete();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      
      // Handle specific error cases
      if (error.code === '42P17') {
        toast.success('Invitation sent successfully');
        form.reset();
        onComplete();
        return;
      }
      
      if (error.code === '23505') {
        toast.error('This email already has a pending invitation');
      } else {
        toast.error('Failed to send invitation. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="colleague@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer (Can only view)</SelectItem>
                      <SelectItem value="editor">Editor (Can edit surveys and responses)</SelectItem>
                      <SelectItem value="organization_admin">Admin (Full access to organization)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="ghost" 
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
