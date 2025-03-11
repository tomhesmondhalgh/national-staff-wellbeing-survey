
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
    
    if (members) {
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
    
    if (invitations && Array.isArray(invitations) && invitations.length > 0) {
      console.log('Processing invitations for display:', invitations.length);
      
      invitations.forEach(invitation => {
        console.log('Adding invitation:', invitation.id, invitation.email, invitation.role);
        
        items.push({
          id: invitation.id,
          type: 'invitation',
          email: invitation.email,
          role: invitation.role,
          created_at: invitation.created_at,
          expires_at: invitation.expires_at,
          data: invitation
        });
      });
    } else {
      console.log('No invitations to display');
    }
    
    console.log('Final team members array:', items.length);
    return items;
  }, [members, invitations, profiles]);

  useEffect(() => {
    console.log('Team members array (combined):', teamMembers.length);
    console.log('Members:', members?.length || 0);
    console.log('Invitations:', invitations?.length || 0);
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
