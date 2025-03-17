
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

  // Fetch descriptors on mount and when section/userId changes
  useEffect(() => {
    if (userId && section) {
      fetchDescriptors();
    }
  }, [userId, section]);

  const fetchDescriptors = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching descriptors for user:', userId, 'section:', section);
      const result = await getActionPlanDescriptors(userId, section);
      setIsLoading(false);

      if (result.success && result.data) {
        console.log('Fetched descriptors successfully:', result.data);
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
        console.error('Failed to load descriptors:', result.error);
        toast.error('Failed to load data');
      }
    } catch (error) {
      console.error('Exception fetching descriptors:', error);
      setIsLoading(false);
      toast.error('An error occurred while loading data');
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
    try {
      const result = await updateDescriptor(id, { status });
      if (result.success) {
        setDescriptors(descriptors.map(d => d.id === id ? { ...d, status } : d));
        onRefreshSummary();
      } else {
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      console.error('Exception updating status:', error);
    }
  };

  const handleDateChange = async (id: string, date: string) => {
    try {
      const result = await updateDescriptor(id, { deadline: date || null });
      if (result.success) {
        setDescriptors(descriptors.map(d => d.id === id ? { ...d, deadline: date } : d));
      } else {
        console.error('Failed to update date:', result.error);
      }
    } catch (error) {
      console.error('Exception updating date:', error);
    }
  };

  const handleEditSave = async () => {
    if (!editingCell) return;

    const { id, field } = editingCell;
    const updates: Partial<ActionPlanDescriptor> = { [field]: editValue };
    
    try {
      const result = await updateDescriptor(id, updates);
      if (result.success) {
        setDescriptors(descriptors.map(d => d.id === id ? { ...d, [field]: editValue } : d));
        setEditingCell(null);
      } else {
        console.error('Failed to save edit:', result.error);
      }
    } catch (error) {
      console.error('Exception saving edit:', error);
    }
  };

  const handleProgressNoteAdded = async () => {
    console.log('Progress note added, refreshing data');
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
