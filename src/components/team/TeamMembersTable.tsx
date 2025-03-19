
import { useState } from 'react';
import { UserPlus, Users, MoreVertical } from 'lucide-react';
import { TeamMember } from './types';
import { UserRoleType } from '../../lib/supabase/client';
import { Button } from '../ui/button';
import Pagination from '../surveys/Pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import TeamMemberActions from './TeamMemberActions';

type TeamMembersTableProps = {
  filteredItems: TeamMember[];
  refetchAll: () => void;
  itemsPerPage?: number;
};

export default function TeamMembersTable({ 
  filteredItems, 
  refetchAll,
  itemsPerPage = 10 
}: TeamMembersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  
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
  
  if (paginatedItems.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Users size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 mb-2 font-medium">No team members found</p>
        <p className="text-gray-400 text-sm">Click "Invite Member" to add people to your organization.</p>
      </div>
    );
  }
  
  return (
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
                    {item.type === 'member' ? 'Active' : 'Pending Invitation'}
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
                      <DropdownMenuItem asChild>
                        <TeamMemberActions
                          memberId={item.id}
                          type={item.type}
                          refetchAll={refetchAll}
                          member={item.type === 'member' ? item.data : undefined}
                        />
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
  );
}
