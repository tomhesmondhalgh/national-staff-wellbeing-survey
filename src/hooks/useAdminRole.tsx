
import { useAdminRoleOptimized } from './useAdminRoleOptimized';

export function useAdminRole() {
  // Use the optimized version with caching
  return useAdminRoleOptimized();
}
