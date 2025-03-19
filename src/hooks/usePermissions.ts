
import { useAuth } from "../contexts/AuthContext";
import { useSubscription } from "./useSubscription";

/**
 * A simplified permissions hook that provides basic access control
 */
export const usePermissions = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();

  const isLoading = isAuthLoading || isSubscriptionLoading;

  // All authenticated users are considered 'users'
  // Users with active subscriptions are considered 'subscribers'
  const userRole = user ? (subscription?.isActive ? 'subscriber' : 'user') : '';

  // Check if user can create content
  const canCreate = async () => {
    return !!user;
  };

  // Check if user can edit content
  const canEdit = async () => {
    return !!user;
  };

  // Check if user can view content
  const canView = async () => {
    return !!user;
  };

  return {
    canCreate,
    canEdit,
    canView,
    isLoading,
    userRole
  };
};
