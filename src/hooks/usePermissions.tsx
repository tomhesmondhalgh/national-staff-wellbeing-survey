
import { useRoleFetcher } from './useRoleFetcher';
import { useRoleChecks } from './useRoleChecks';
import { usePermissionActions } from './usePermissionActions';

export function usePermissions() {
  const { userRole, isLoading, queryError } = useRoleFetcher();
  const { hasPermission } = useRoleChecks(userRole);
  const { canCreate, canEdit, canManageTeam, canManageGroups, isAdmin } = usePermissionActions(userRole);

  return {
    userRole,
    isLoading,
    hasPermission,
    canCreate,
    canEdit,
    canManageTeam,
    canManageGroups,
    isAdmin,
    error: queryError
  };
}
