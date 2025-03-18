
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Organization } from '../lib/supabase/client';

export interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<boolean>;
  organizations: Organization[];
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  currentOrganization: null,
  setCurrentOrganization: () => {},
  isLoading: true,
  switchOrganization: async () => false,
  organizations: [],
  refreshOrganizations: async () => {}
});

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrganizations = async () => {
    if (!user) return [];
    try {
      const { data: orgMembers, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id);
        
      if (orgError) {
        console.error('Error fetching organization members:', orgError);
        return [];
      }
      
      const orgs: Organization[] = [];
      
      for (const org of orgMembers || []) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, school_name, created_at, updated_at')
          .eq('id', org.organization_id)
          .single();
          
        if (profileError) {
          console.error('Error fetching org profile:', profileError);
          continue;
        }
        
        if (profile) {
          orgs.push({
            id: profile.id,
            name: profile.school_name,
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          });
        }
      }
      
      return orgs;
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  };

  const refreshOrganizations = async () => {
    if (!user) return;
    const orgs = await fetchOrganizations();
    setOrganizations(orgs);
  };

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
              .select('id, school_name, created_at, updated_at')
              .eq('id', orgMembers.organization_id)
              .single();

            if (profileError) {
              console.error('Error fetching organization profile:', profileError);
              setIsLoading(false);
              return;
            }

            if (organization) {
              setCurrentOrganization({
                id: organization.id,
                name: organization.school_name,
                created_at: organization.created_at || new Date().toISOString(),
                updated_at: organization.updated_at || new Date().toISOString()
              });
            }
          }
          
          // Fetch all organizations for the user
          const orgs = await fetchOrganizations();
          setOrganizations(orgs);
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
        .select('id, school_name, created_at, updated_at')
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
        name: organization.school_name,
        created_at: organization.created_at || new Date().toISOString(),
        updated_at: organization.updated_at || new Date().toISOString()
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
    <OrganizationContext.Provider value={{ 
      currentOrganization, 
      setCurrentOrganization, 
      isLoading, 
      switchOrganization,
      organizations,
      refreshOrganizations
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};
