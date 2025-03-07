
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, Plus, CalendarIcon } from 'lucide-react';
import { ActionPlanDescriptor, DescriptorStatus } from '@/types/actionPlan';
import { updateDescriptor, getActionPlanDescriptors } from '@/utils/actionPlanUtils';
import ProgressNoteDialog from './ProgressNoteDialog';
import ProgressNotesList from './ProgressNotesList';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DescriptorTableProps {
  userId: string;
  section: string;
  onRefreshSummary: () => void;
}

const DescriptorTable: React.FC<DescriptorTableProps> = ({ userId, section, onRefreshSummary }) => {
  const [descriptors, setDescriptors] = useState<ActionPlanDescriptor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressNoteId, setProgressNoteId] = useState<string | null>(null);
  const [viewNotesId, setViewNotesId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchDescriptors();
  }, [userId, section]);

  const fetchDescriptors = async () => {
    setIsLoading(true);
    const result = await getActionPlanDescriptors(userId, section);
    setIsLoading(false);

    if (result.success && result.data) {
      const sortedDescriptors = result.data.sort((a, b) => {
        if (!a.index_number) return 1;
        if (!b.index_number) return -1;
        return a.index_number.localeCompare(b.index_number, undefined, { numeric: true });
      });
      
      const uniqueDescriptors = Array.from(
        new Map(sortedDescriptors.map(descriptor => 
          [descriptor.index_number + descriptor.reference, descriptor]
        )).values()
      );
      
      setDescriptors(uniqueDescriptors);
    } else {
      toast.error('Failed to load data');
    }
  };

  const filteredDescriptors = descriptors.filter(
    descriptor => 
      descriptor.descriptor_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descriptor.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      descriptor.index_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (descriptor.assigned_to && descriptor.assigned_to.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (descriptor.key_actions && descriptor.key_actions.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStatusChange = async (id: string, status: DescriptorStatus) => {
    const result = await updateDescriptor(id, { status });
    if (result.success) {
      setDescriptors(descriptors.map(d => d.id === id ? { ...d, status } : d));
      onRefreshSummary();
    }
  };

  const handleDateChange = async (id: string, date: string) => {
    const result = await updateDescriptor(id, { deadline: date || null });
    if (result.success) {
      setDescriptors(descriptors.map(d => d.id === id ? { ...d, deadline: date } : d));
    }
  };

  const handleEditStart = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setEditValue(value || '');
  };

  const handleEditSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    const updates: Partial<ActionPlanDescriptor> = { [field]: editValue };
    
    const result = await updateDescriptor(id, updates);
    if (result.success) {
      setDescriptors(descriptors.map(d => d.id === id ? { ...d, [field]: editValue } : d));
      setEditingCell(null);
    }
  };

  const getStatusColor = (status: DescriptorStatus) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Blocked': return 'bg-red-100 text-red-800';
      case 'Not Started': return 'bg-gray-100 text-gray-800';
      case 'Not Applicable': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleProgressNoteAdded = async () => {
    await fetchDescriptors();
    onRefreshSummary();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search descriptors..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading descriptors...</div>
      ) : filteredDescriptors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'No descriptors match your search' : 'No descriptors available for this section'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-16">Index</th>
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-1/4">Descriptor</th>
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-44">Status & Deadline</th>
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-32">Assigned To</th>
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200">Key Actions</th>
                <th className="p-2 text-left font-medium text-gray-600 border border-gray-200 w-28">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredDescriptors.map((descriptor) => (
                <tr key={descriptor.id} className="hover:bg-gray-50">
                  <td className="p-2 border border-gray-200 font-medium text-gray-700">
                    {descriptor.index_number}
                  </td>
                  <td className="p-2 border border-gray-200 text-sm">
                    {descriptor.descriptor_text}
                  </td>
                  <td className="p-2 border border-gray-200">
                    <div className="flex flex-col space-y-2">
                      <Select
                        value={descriptor.status}
                        onValueChange={(value) => handleStatusChange(descriptor.id, value as DescriptorStatus)}
                      >
                        <SelectTrigger className={cn("h-8 text-xs", getStatusColor(descriptor.status))}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex items-center">
                        <CalendarIcon className="h-3 w-3 mr-1 text-gray-500" />
                        <Input
                          type="date"
                          value={descriptor.deadline || ''}
                          onChange={(e) => handleDateChange(descriptor.id, e.target.value)}
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-2 border border-gray-200">
                    {editingCell?.id === descriptor.id && editingCell?.field === 'assigned_to' ? (
                      <div className="flex">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSave}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                          className="h-8 text-xs"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer h-8 flex items-center text-sm"
                        onClick={() => handleEditStart(descriptor.id, 'assigned_to', descriptor.assigned_to || '')}
                      >
                        {descriptor.assigned_to || <span className="text-gray-400 text-xs">Click to assign</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-gray-200">
                    {editingCell?.id === descriptor.id && editingCell?.field === 'key_actions' ? (
                      <div className="flex">
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditSave}
                          className="text-sm min-h-[60px]"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer min-h-[40px] text-sm"
                        onClick={() => handleEditStart(descriptor.id, 'key_actions', descriptor.key_actions || '')}
                      >
                        {descriptor.key_actions || <span className="text-gray-400 text-xs">Click to add key actions</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-2 border border-gray-200">
                    <div className="flex flex-col space-y-1">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setViewNotesId(descriptor.id)}
                        className="h-7 px-2 text-xs w-full justify-start"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        {descriptor.progress_notes_count || 0}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setProgressNoteId(descriptor.id)}
                        className="h-7 px-2 text-xs w-full justify-start"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {progressNoteId && (
        <ProgressNoteDialog
          descriptorId={progressNoteId}
          isOpen={!!progressNoteId}
          onClose={() => setProgressNoteId(null)}
          onSuccess={handleProgressNoteAdded}
        />
      )}

      {viewNotesId && (
        <ProgressNotesList
          descriptorId={viewNotesId}
          isOpen={!!viewNotesId}
          onClose={() => setViewNotesId(null)}
        />
      )}
    </div>
  );
};

export default DescriptorTable;
