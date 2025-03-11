
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type TeamMemberFiltersProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  setCurrentPage: (page: number) => void;
};

export default function TeamMemberFilters({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  setCurrentPage,
}: TeamMemberFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-10"
        />
      </div>
      <div className="w-full md:w-48">
        <Select
          value={roleFilter}
          onValueChange={(value) => {
            setRoleFilter(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="organization_admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
