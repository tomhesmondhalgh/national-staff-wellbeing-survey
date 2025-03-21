
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

const MemberList = () => {
  const { currentOrganization } = useOrganization();
  const { userRole, hasPermission } = usePermissions();
  const { isTestingMode, testingRole } = useTestingMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [hasViewPermission, setHasViewPermission] = useState<boolean | null>(null);
  const [isPermissionLoading, setIsPermissionLoading] = useState(true);

  // Check for team member view permission
  useEffect(() => {
    const checkPermission = async () => {
      setIsPermissionLoading(true);
      
      if (currentOrganization) {
        // If in testing mode with admin role, grant permission automatically
        if (isTestingMode && 
            (testingRole === 'organization_admin' || 
             testingRole === 'group_admin' || 
             testingRole === 'administrator' || 
             testingRole === 'editor' || 
             testingRole === 'viewer')) {
          setHasViewPermission(true);
          setIsPermissionLoading(false);
          return;
        }
        
        try {
          const canView = await hasPermission('viewer');
          console.log('Permission check result for viewer:', canView);
          setHasViewPermission(canView);
        } catch (error) {
          console.error('Error checking view permission:', error);
          setHasViewPermission(false);
        }
      } else {
        setHasViewPermission(null);
      }
      
      setIsPermissionLoading(false);
    };

    checkPermission();
  }, [currentOrganization, hasPermission, isTestingMode, testingRole]);

  const { 
    data: membersData, 
    isLoading: isDataLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['organizationMembers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) {
        return { members: [], profiles: [], total: 0 };
      }
      
      if (hasViewPermission === false) {
        throw new Error('permission_denied');
      }

      try {
        const { data: members, error: membersError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', currentOrganization.id);
          
        if (membersError) {
          console.error('Error fetching members:', membersError);
          throw new Error(`Failed to load team members: ${membersError.message}`);
        }
        
        if (!members || members.length === 0) {
          return { members: [], profiles: [], total: 0 };
        }
        
        // Get user profiles
        const userIds = members.map(member => member.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw new Error('Failed to load member profiles');
        }
        
        return {
          members,
          profiles: profiles || [],
          total: members.length
        };
      } catch (error) {
        console.error('Error in members query function:', error);
        throw error;
      }
    },
    enabled: !!currentOrganization && hasViewPermission !== false && !isPermissionLoading
  });

  // Combined loading state
  const isLoading = isPermissionLoading || isDataLoading;

  const filteredMembers = membersData?.members.filter(member => {
    const profile = membersData.profiles.find(p => p.id === member.user_id);
    const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.toLowerCase();
    const matchesSearch = searchTerm === '' || fullName.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];
  
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        
      if (error) {
        toast.error('Failed to remove member');
        throw error;
      }
      
      toast.success('Member removed successfully');
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
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

  if (!currentOrganization) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          Please select an organization to manage team members.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (hasViewPermission === false) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          You do not have permission to view team members.
          {isTestingMode && (
            <span className="block mt-2 text-sm">
              Testing Mode is enabled, but your role ({testingRole || 'none'}) doesn't have permission 
              to view members. Change your testing role to viewer, editor, or admin.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    // Check if the error is related to database permissions
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPermissionError = errorMessage.includes('policy') || 
                             errorMessage.includes('permission') || 
                             errorMessage.includes('recursion') ||
                             errorMessage === 'permission_denied';
    
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertDescription>
          {isPermissionError ? 
            'You do not have permission to view team members.' : 
            'Failed to load team members. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Organization Members</h2>
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

      {(!membersData?.members || membersData.members.length === 0) ? (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedMembers.map((member) => {
                  const profile = membersData.profiles.find(p => p.id === member.user_id);
                  return (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brandPurple-100 flex items-center justify-center">
                            <span className="text-brandPurple-800 font-medium">
                              {profile?.first_name?.charAt(0) || ''}
                              {profile?.last_name?.charAt(0) || ''}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {profile?.first_name} {profile?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{profile?.job_title || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(member.role)}`}>
                          {getRoleDisplayName(member.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRole(member)}>
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Remove
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

export default MemberList;
