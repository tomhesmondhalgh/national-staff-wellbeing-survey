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
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface CreateOrganizationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const createOrgFormSchema = z.object({
  name: z.string().min(2, { message: "Organisation name must be at least 2 characters" }),
  groupId: z.string().uuid({ message: "Please select a group" }),
});

type CreateOrgFormValues = z.infer<typeof createOrgFormSchema>;

const CreateOrganizationDialog: React.FC<CreateOrganizationDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userGroups, setUserGroups] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  
  React.useEffect(() => {
    const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true);
        
        const { data: userGroups, error: groupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
          .eq('role', 'group_admin');
          
        if (groupsError) {
          throw groupsError;
        }
        
        if (!userGroups.length) {
          setUserGroups([]);
          return;
        }
        
        const groupIds = userGroups.map(g => g.group_id);
        
        const { data: groups, error } = await supabase
          .from('groups')
          .select('id, name')
          .in('id', groupIds);
          
        if (error) {
          throw error;
        }
        
        setUserGroups(groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        toast.error('Failed to load groups');
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);
  
  const form = useForm<CreateOrgFormValues>({
    resolver: zodResolver(createOrgFormSchema),
    defaultValues: {
      name: '',
      groupId: '',
    },
  });

  const handleSubmit = async (values: CreateOrgFormValues) => {
    setIsSubmitting(true);
    
    try {
      const orgId = uuidv4();
      
      const { data: orgData, error: orgError } = await supabase
        .from('profiles')
        .insert({
          id: orgId,
          school_name: values.name,
        })
        .select('id')
        .single();
        
      if (orgError) {
        throw orgError;
      }
      
      const { error: groupOrgError } = await supabase
        .from('group_organizations')
        .insert({
          group_id: values.groupId,
          organization_id: orgData.id,
        });
        
      if (groupOrgError) {
        throw groupOrgError;
      }
      
      toast.success('Organisation created successfully');
      form.reset();
      onComplete();
    } catch (error) {
      console.error('Error creating organisation:', error);
      toast.error('Failed to create organisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organisation</DialogTitle>
          <DialogDescription>
            Create a new organisation and add it to a group
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organisation Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter organisation name" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoadingGroups || userGroups.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingGroups 
                            ? "Loading groups..." 
                            : userGroups.length === 0 
                              ? "No groups available" 
                              : "Select a group"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
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
                disabled={isSubmitting || isLoadingGroups || userGroups.length === 0}
                className="bg-brandPurple-500 hover:bg-brandPurple-600"
              >
                {isSubmitting ? 'Creating...' : 'Create Organisation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
