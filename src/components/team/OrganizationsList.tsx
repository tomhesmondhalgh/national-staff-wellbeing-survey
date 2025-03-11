
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Building, Plus, Search, MoreVertical } from 'lucide-react';
import { Input } from '../ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Pagination from '../surveys/Pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import CreateOrganizationDialog from './CreateOrganizationDialog';

const ITEMS_PER_PAGE = 10;

const OrganizationsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: organizationsData, isLoading, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      // First get all groups the user is an admin of
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .eq('role', 'group_admin');
        
      if (groupsError) {
        toast.error('Failed to load user groups');
        throw groupsError;
      }
      
      if (!userGroups.length) {
        return { organizations: [], total: 0 };
      }
      
      const groupIds = userGroups.map(g => g.group_id);
      
      // Get all organizations in these groups
      const { data: groupOrgs, error: orgsError } = await supabase
        .from('group_organizations')
        .select('organization_id')
        .in('group_id', groupIds);
        
      if (orgsError) {
        toast.error('Failed to load group organizations');
        throw orgsError;
      }
      
      if (!groupOrgs.length) {
        return { organizations: [], total: 0 };
      }
      
      const orgIds = groupOrgs.map(o => o.organization_id);
      
      // Get organization profiles
      const { data: organizations, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', orgIds);
        
      if (profilesError) {
        toast.error('Failed to load organization profiles');
        throw profilesError;
      }
      
      return {
        organizations,
        total: organizations.length
      };
    }
  });

  // Filter organizations based on search term
  const filteredOrganizations = organizationsData?.organizations.filter(org => {
    const orgName = org.school_name || '';
    return searchTerm === '' || orgName.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];
  
  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / ITEMS_PER_PAGE);
  const paginatedOrganizations = filteredOrganizations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCreateComplete = () => {
    refetch();
    setIsCreateDialogOpen(false);
  };

  const handleRemoveOrganization = async (orgId: string) => {
    if (!confirm("Are you sure you want to remove this organization? This will remove all members and data.")) return;
    
    try {
      // First find all groups the organization belongs to
      const { data: groupOrgs, error: findError } = await supabase
        .from('group_organizations')
        .select('group_id')
        .eq('organization_id', orgId);
        
      if (findError) {
        throw findError;
      }
      
      // Then remove it from all groups
      for (const groupOrg of groupOrgs) {
        const { error: removeError } = await supabase
          .from('group_organizations')
          .delete()
          .eq('organization_id', orgId)
          .eq('group_id', groupOrg.group_id);
          
        if (removeError) {
          throw removeError;
        }
      }
      
      toast.success('Organization removed successfully');
      refetch();
    } catch (error) {
      console.error('Error removing organization:', error);
      toast.error('Failed to remove organization');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Organizations</h2>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-brandPurple-500 hover:bg-brandPurple-600"
        >
          <Plus size={16} className="mr-2" />
          Create Organization
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full"></div>
        </div>
      ) : paginatedOrganizations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No organizations found</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrganizations.map((organization) => (
                  <tr key={organization.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building size={16} className="text-blue-600" />
                        </div>
                        <div className="ml-4 text-sm font-medium text-gray-900">
                          {organization.school_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/team?organization=${organization.id}`} className="w-full">
                              Manage Members
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveOrganization(organization.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remove
                          </DropdownMenuItem>
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

      <CreateOrganizationDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        onComplete={handleCreateComplete}
      />
    </div>
  );
};

export default OrganizationsList;
