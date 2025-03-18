
import { useMemo, useEffect } from 'react';
import { TeamMember, FilterParams } from '../types';
import { OrganizationMember } from '../../../lib/supabase/client';

export function useCombinedTeamMembers(
  members: OrganizationMember[] | undefined,
  invitations: any[] | undefined,
  profiles: any[] | undefined,
  filterParams: FilterParams
) {
  const { searchTerm, roleFilter } = filterParams;

  const teamMembers: TeamMember[] = useMemo(() => {
    const items: TeamMember[] = [];
    
    // Add regular members
    if (members && Array.isArray(members) && members.length > 0) {
      console.log(`Adding ${members.length} regular members to the display list`);
      
      items.push(...members.map(member => ({
        id: member.id,
        type: 'member' as const,
        email: profiles?.find(p => p.id === member.user_id)?.email,
        role: member.role,
        created_at: member.created_at,
        profile: profiles?.find(p => p.id === member.user_id),
        data: member
      })));
    }
    
    // Add invitations
    if (invitations && Array.isArray(invitations) && invitations.length > 0) {
      console.log(`Adding ${invitations.length} invitations to the display list`);
      
      items.push(...invitations.map(invitation => ({
        id: invitation.id,
        type: 'invitation' as const,
        email: invitation.email,
        role: invitation.role,
        created_at: invitation.created_at,
        expires_at: invitation.expires_at,
        data: invitation
      })));
    } else {
      console.log('No invitations to display or invitations data is invalid');
    }
    
    console.log('Final team members array (combined):', items.length);
    return items;
  }, [members, invitations, profiles]);

  // Debug logging
  useEffect(() => {
    console.log('Combined team members:', teamMembers.length);
    console.log('Members count:', members?.length || 0);
    console.log('Invitations count:', invitations?.length || 0);
  }, [teamMembers, members, invitations]);

  const filteredItems = useMemo(() => {
    return teamMembers.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.profile && `${item.profile.first_name || ''} ${item.profile.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'all' || item.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [teamMembers, searchTerm, roleFilter]);

  return {
    teamMembers,
    filteredItems
  };
}
