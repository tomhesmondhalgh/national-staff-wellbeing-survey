
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, getUserOrganizations } from '../lib/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const orgs = await getUserOrganizations();
      console.log('Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      // If there are organizations, set the first one as current
      // or keep the current one if it's still in the list
      if (orgs.length > 0) {
        if (currentOrganization && orgs.some(org => org.id === currentOrganization.id)) {
          // Keep current organization, it's still valid
        } else {
          // Set first organization as current
          setCurrentOrganization(orgs[0]);
        }
      } else {
        setCurrentOrganization(null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organizations on initial load and when user changes
  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const switchOrganization = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
      // Save the selection to localStorage for persistence
      localStorage.setItem('currentOrganizationId', orgId);
      toast.success(`Switched to ${org.name}`);
    }
  };

  const refreshOrganizations = async () => {
    await fetchOrganizations();
  };

  // On component mount, restore the selected organization from localStorage
  useEffect(() => {
    if (organizations.length > 0) {
      const savedOrgId = localStorage.getItem('currentOrganizationId');
      
      if (savedOrgId) {
        const savedOrg = organizations.find(org => org.id === savedOrgId);
        if (savedOrg) {
          setCurrentOrganization(savedOrg);
        }
      }
    }
  }, [organizations]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        isLoading,
        switchOrganization,
        refreshOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
