import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { UserPlus, Search, MoreVertical, MailIcon, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../lib/supabase';
import { Invitation, UserRoleType } from '../../lib/supabase/client';
import InviteMemberDialog from './InviteMemberDialog';
import { toast } from 'sonner';
import Pagination from '../surveys/Pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Alert, AlertDescription } from '../ui/alert';

const ITEMS_PER_PAGE = 10;

const InvitationsList = () => {
  const { currentOrganization } = useOrganization();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const { data: invitationsData, isLoading, error, refetch } = useQuery({
    queryKey: ['organizationInvitations', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return { invitations: [], total: 0 };
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString());
        
      if (error) {
        toast.error('Failed to load invitations');
        throw error;
      }
      
      return {
        invitations: data || [],
        total: (data || []).length
      };
    },
    enabled: !!currentOrganization
  });

  const filteredInvitations = invitationsData?.invitations.filter(invitation => {
    return searchTerm === '' || invitation.email.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];
  
  const totalPages = Math.ceil(filteredInvitations.length / ITEMS_PER_PAGE);
  const paginatedInvitations = filteredInvitations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleInvitationComplete = () => {
    refetch();
    setIsInviteDialogOpen(false);
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) {
        toast.error('Failed to cancel invitation');
        throw error;
      }
      
      toast.success('Invitation cancelled successfully');
      refetch();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    try {
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', invitation.id);
        
      if (updateError) {
        throw updateError;
      }
      
      const { data: orgData, error: orgError } = await supabase
        .from('profiles')
        .select('school_name')
        .eq('id', invitation.organization_id)
        .single();
      
      const organizationName = orgData?.school_name || 'your organization';
      
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: {
          email: invitation.email,
          organizationName: organizationName,
          role: invitation.role,
          invitedBy: (await supabase.auth.getUser()).data.user?.email,
        }
      });
      
      if (emailError) {
        console.error('Error resending invitation email:', emailError);
        // Continue anyway
      }
      
      toast.success('Invitation resent successfully');
      refetch();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const getRoleBadgeClass = (role: UserRoleType) => {
    switch (role) {
      case 'organization_admin':
        return 'bg-blue-100 text-blue-800';
      case 'editor':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: UserRoleType) => {
    switch (role) {
      case 'organization_admin': return 'Admin';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      case 'administrator': return 'System Admin';
      default: return role;
    }
  };

  if (!currentOrganization) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Please select an organization to manage invitations.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Error loading invitations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Pending Invitations</h2>
        <Button
          onClick={() => setIsInviteDialogOpen(true)}
          className="bg-brandPurple-500 hover:bg-brandPurple-600"
        >
          <UserPlus size={16} className="mr-2" />
          Invite Member
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : paginatedInvitations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No pending invitations</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedInvitations.map((invitation) => {
                  return (
                    <tr key={invitation.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <MailIcon size={16} className="text-gray-600" />
                          </div>
                          <div className="ml-4 text-sm text-gray-900">{invitation.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(invitation.role)}`}>
                          {getRoleDisplayName(invitation.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResendInvitation(invitation)}>
                              Resend
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}

      <InviteMemberDialog 
        isOpen={isInviteDialogOpen} 
        onClose={() => setIsInviteDialogOpen(false)} 
        onComplete={handleInvitationComplete}
        organizationId={currentOrganization.id}
      />
    </div>
  );
};

export default InvitationsList;
