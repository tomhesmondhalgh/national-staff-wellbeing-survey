import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ActionPlanDescriptor, DescriptorStatus } from '@/types/actionPlan';
import { updateDescriptor, getActionPlanDescriptors } from '@/utils/actionPlanUtils';
import ProgressNoteDialog from './ProgressNoteDialog';
import ProgressNotesList from './ProgressNotesList';
import SearchBar from './SearchBar';
import DescriptorsTable from './DescriptorsTable';
import { useEditableCell } from '@/hooks/useEditableCell';

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
  const { editingCell, editValue, setEditValue, handleEditStart, setEditingCell } = useEditableCell();

  useEffect(() => {
    fetchDescriptors();
  }, [userId, section]);

  const fetchDescriptors = async () => {
    setIsLoading(true);
    const result = await getActionPlanDescriptors(userId, section);
    setIsLoading(false);

    if (result.success && result.data) {
      const descriptorData = result.data as ActionPlanDescriptor[];
      
      const sortedDescriptors = descriptorData.sort((a, b) => {
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

  const handleProgressNoteAdded = async () => {
    await fetchDescriptors();
    onRefreshSummary();
  };

  return (
    <div className="space-y-4">
      <SearchBar 
        searchTerm={searchTerm} 
        onSearchChange={setSearchTerm} 
      />

      {isLoading ? (
        <div className="text-center py-12">Loading descriptors...</div>
      ) : filteredDescriptors.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'No descriptors match your search' : 'No descriptors available for this section'}
        </div>
      ) : (
        <DescriptorsTable
          descriptors={filteredDescriptors}
          editingCell={editingCell}
          editValue={editValue}
          onEditStart={handleEditStart}
          onEditValueChange={setEditValue}
          onEditSave={handleEditSave}
          onStatusChange={handleStatusChange}
          onDateChange={handleDateChange}
          onViewNotes={setViewNotesId}
          onAddNote={setProgressNoteId}
        />
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
