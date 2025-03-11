
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OrganizationMember, UserRoleType, supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

interface EditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: OrganizationMember;
  onRoleUpdated: () => void;
}

const roleFormSchema = z.object({
  role: z.enum(['viewer', 'editor', 'organization_admin'] as const),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

const EditRoleDialog: React.FC<EditRoleDialogProps> = ({
  isOpen,
  onClose,
  member,
  onRoleUpdated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      role: member.role as 'viewer' | 'editor' | 'organization_admin',
    },
  });

  const handleSubmit = async (values: RoleFormValues) => {
    if (values.role === member.role) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: values.role as UserRoleType })
        .eq('id', member.id);
        
      if (error) {
        throw error;
      }
      
      toast.success('Member role updated successfully');
      onRoleUpdated();
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member Role</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                {isSubmitting ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditRoleDialog;
