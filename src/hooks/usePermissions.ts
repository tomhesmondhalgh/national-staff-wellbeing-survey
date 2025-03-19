
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "./useSubscription";

/**
 * A simplified permissions hook that replaces the role-based system
 * and just checks if the user is logged in and has an active subscription
 */
export const usePermissions = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();

  const isLoading = isAuthLoading || isSubscriptionLoading;

  // Provide a simple role based on subscription status
  // Default is 'user' for all authenticated users
  const userRole = subscription?.isActive ? 'subscriber' : 'user';

  // Check if user can create surveys/content
  const canCreate = async () => {
    if (!user) return false;
    return !!subscription?.isActive;
  };

  // Check if user can edit content
  const canEdit = async () => {
    if (!user) return false;
    return !!subscription?.isActive;
  };

  // Check if user has admin access
  const isAdmin = async () => {
    if (!user) return false;
    return false; // Will be determined by the useAdminRole hook
  };

  return {
    canCreate,
    canEdit,
    isAdmin,
    isLoading,
    userRole
  };
};
