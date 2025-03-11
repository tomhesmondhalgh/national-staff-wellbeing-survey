
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
