
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { UserPlus, Search, MoreVertical, AlertCircle, Users } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useOrganization } from '../../contexts/OrganizationContext';
import { supabase } from '../../lib/supabase';
import { OrganizationMember, UserRoleType } from '../../lib/supabase/client';
import InviteMemberDialog from './InviteMemberDialog';
import { toast } from 'sonner';
import Pagination from '../surveys/Pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import EditRoleDialog from './EditRoleDialog';
import { Alert, AlertDescription } from '../ui/alert';
import { usePermissions } from '../../hooks/usePermissions';
import { useTestingMode } from '../../contexts/TestingModeContext';

const ITEMS_PER_PAGE = 10;

type TeamMember = {
  id: string;
  type: 'member' | 'invitation';
  email: string | null;
  role: UserRoleType;
  created_at: string;
  expires_at?: string;
  profile?: any;
  data: any;
};

const MembersAndInvitationsList = () => {
  const { currentOrganization } = useOrganization();
  const { userRole } = usePermissions();
  const { isTestingMode, testingRole } = useTestingMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);

  const { data: combinedData, isLoading, error, refetch } = useQuery({
    queryKey: ['organizationMembersAndInvitations', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return { members: [], invitations: [], profiles: [] };
      }

      try {
        // Fetch members
        const { data: members, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', currentOrganization.id);
          
        if (membersError) throw membersError;

        // Fetch active invitations
        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', currentOrganization.id)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString());
          
        if (invitationsError) throw invitationsError;

        // Get user profiles for members
        const userIds = members?.map(member => member.user_id) || [];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;

        return {
          members: members || [],
          invitations: invitations || [],
          profiles: profiles || []
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
      }
    },
    enabled: !!currentOrganization
  });

  const teamMembers: TeamMember[] = React.useMemo(() => {
    const items: TeamMember[] = [];
    
    // Add members
    if (combinedData?.members) {
      items.push(...combinedData.members.map(member => ({
        id: member.id,
        type: 'member',
        email: combinedData.profiles.find(p => p.id === member.user_id)?.email,
        role: member.role,
        created_at: member.created_at,
        profile: combinedData.profiles.find(p => p.id === member.user_id),
        data: member
      })));
    }
    
    // Add invitations
    if (combinedData?.invitations) {
      items.push(...combinedData.invitations.map(invitation => ({
        id: invitation.id,
        type: 'invitation',
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        data: invitation
      })));
    }

    return items;
  }, [combinedData]);

  const filteredItems = React.useMemo(() => {
    return teamMembers.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.profile && `${item.profile.first_name} ${item.profile.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'all' || item.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchTerm, roleFilter]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const handleInvitationComplete = () => {
    refetch();
    setIsInviteDialogOpen(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
        
      if (error) throw error;
      
      toast.success('Member removed successfully');
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);
        
      if (error) throw error;
      
      toast.success('Invitation cancelled successfully');
      refetch();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleEditRole = (member: OrganizationMember) => {
    setSelectedMember(member);
    setIsEditRoleDialogOpen(true);
  };

  const handleRoleUpdated = () => {
    refetch();
    setIsEditRoleDialogOpen(false);
    setSelectedMember(null);
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
      case 'group_admin': return 'Group Admin';
      case 'administrator': return 'System Admin';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Failed to load team members and invitations. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Team Members</h2>
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
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="organization_admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {paginatedItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-2 font-medium">No team members found</p>
          <p className="text-gray-400 text-sm">Click "Invite Member" to add people to your organization.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name/Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined/Invited</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brandPurple-100 flex items-center justify-center">
                          {item.type === 'member' && item.profile ? (
                            <span className="text-brandPurple-800 font-medium">
                              {item.profile.first_name?.charAt(0) || ''}
                              {item.profile.last_name?.charAt(0) || ''}
                            </span>
                          ) : (
                            <UserPlus size={16} className="text-brandPurple-800" />
                          )}
                        </div>
                        <div className="ml-4">
                          {item.type === 'member' && item.profile ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {item.profile.first_name} {item.profile.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{item.email}</div>
                            </>
                          ) : (
                            <div className="text-sm font-medium text-gray-900">{item.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(item.role)}`}>
                        {getRoleDisplayName(item.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === 'member' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.type === 'member' ? 'Created Account' : 'Invited'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.type === 'member' ? (
                            <>
                              <DropdownMenuItem onClick={() => handleEditRole(item.data)}>
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(item.id)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Remove
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleCancelInvitation(item.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Cancel Invitation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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
        organizationId={currentOrganization?.id || ''}
      />

      {selectedMember && (
        <EditRoleDialog
          isOpen={isEditRoleDialogOpen}
          onClose={() => setIsEditRoleDialogOpen(false)}
          member={selectedMember}
          onRoleUpdated={handleRoleUpdated}
        />
      )}
    </div>
  );
};

export default MembersAndInvitationsList;
