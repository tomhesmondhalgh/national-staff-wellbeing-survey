import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Organization } from '../lib/supabase/client';

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<boolean>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  setCurrentOrganization: () => {},
  isLoading: true,
  switchOrganization: async () => false
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrganization = async () => {
      setIsLoading(true);
      try {
        if (user) {
          const { data: orgMembers, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
            .single();

          if (orgError) {
            console.error('Error fetching organization:', orgError);
            setIsLoading(false);
            return;
          }

          if (orgMembers) {
            const { data: organization, error: profileError } = await supabase
              .from('profiles')
              .select('id, school_name as name, created_at, updated_at')
              .eq('id', orgMembers.organization_id)
              .single();

            if (profileError) {
              console.error('Error fetching organization profile:', profileError);
              setIsLoading(false);
              return;
            }

            setCurrentOrganization({
              id: organization?.id || '',
              name: organization?.name || 'Unknown Organization',
              created_at: organization?.created_at || new Date().toISOString(),
              updated_at: organization?.updated_at || new Date().toISOString()
            });
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganization();
  }, [user]);

  const switchOrganization = async (orgId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Fetch organization details
      const { data: organization, error: profileError } = await supabase
        .from('profiles')
        .select('id, school_name as name, created_at, updated_at')
        .eq('id', orgId)
        .single();

      if (profileError) {
        console.error('Error fetching organization profile:', profileError);
        setIsLoading(false);
        return false;
      }

      if (!organization) {
        console.error('Organization not found');
        setIsLoading(false);
        return false;
      }

      setCurrentOrganization({
        id: organization.id,
        name: organization.name,
        created_at: organization.created_at,
        updated_at: organization.updated_at
      });
      return true;
    } catch (error) {
      console.error('Error switching organization:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider value={{ currentOrganization, setCurrentOrganization, isLoading, switchOrganization }}>
      {children}
    </OrganizationContext.Provider>
  );
};
