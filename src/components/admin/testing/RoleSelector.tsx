
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { UserRoleType } from '../../../lib/supabase/types';

interface RoleSelectorProps {
  selectedRole: UserRoleType;
  onRoleChange: (value: UserRoleType) => void;
}

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="role-select" className="text-sm font-medium">User Role:</label>
      <Select 
        value={selectedRole} 
        onValueChange={(value) => onRoleChange(value as UserRoleType)}
      >
        <SelectTrigger id="role-select">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="viewer">Viewer</SelectItem>
          <SelectItem value="editor">Editor</SelectItem>
          <SelectItem value="administrator">Administrator</SelectItem>
          <SelectItem value="group_admin">Group Admin</SelectItem>
          <SelectItem value="organization_admin">Organization Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
