
import { UserRoleType } from '../../lib/supabase/client';

export type TeamMember = {
  id: string;
  type: 'member' | 'invitation';
  email: string | null;
  role: UserRoleType;
  created_at: string;
  expires_at?: string;
  profile?: any;
  data: any;
};

export type FilterParams = {
  searchTerm: string;
  roleFilter: string;
};

// Helper functions to convert database types to TeamMember
export function convertMemberToTeamMember(member: any): TeamMember {
  return {
    id: member.id,
    type: 'member',
    email: member.user_email || null,
    role: member.role,
    created_at: member.created_at,
    data: member,
    profile: member.profile || {}
  };
}

export function convertInvitationToTeamMember(invitation: any): TeamMember {
  return {
    id: invitation.id,
    type: 'invitation',
    email: invitation.email || null,
    role: invitation.role,
    created_at: invitation.created_at,
    expires_at: invitation.expires_at,
    data: invitation,
    profile: {}
  };
}

export function convertToTeamMembers(items: any[], type: 'member' | 'invitation'): TeamMember[] {
  if (!Array.isArray(items)) return [];
  return type === 'member' 
    ? items.map(convertMemberToTeamMember)
    : items.map(convertInvitationToTeamMember);
}
