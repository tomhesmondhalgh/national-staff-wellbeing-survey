import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Organization, getUserOrganizations } from '../lib/supabase/client';
import { supabase } from '../lib/supabase';

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;
  isLoading: boolean;
  error: Error | null;
  refreshOrganizations: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  currentOrganization: null,
  setCurrentOrganization: () => {},
  isLoading: false,
  error: null,
  refreshOrganizations: async () => {},
  switchOrganization: (orgId: string) => {},
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const loadOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const userOrgs = await getUserOrganizations(user.id);
      
      if (userOrgs.length > 0) {
        // Fetch organization names
        for (const org of userOrgs) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('school_name')
              .eq('id', org.id)
              .single();
            
            if (profile && profile.school_name) {
              org.name = profile.school_name;
            }
          } catch (err) {
            console.error('Error fetching org name:', err);
          }
        }
        
        setOrganizations(userOrgs);
        
        // Set current organization if none is selected
        if (!currentOrganization) {
          setCurrentOrganization(userOrgs[0]);
        }
      }
    } catch (err) {
      console.error('Error loading organizations:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganizations = async () => {
    await loadOrganizations();
  };

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(org => org.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        isLoading,
        error,
        refreshOrganizations,
        switchOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
