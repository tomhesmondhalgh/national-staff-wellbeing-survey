
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getProgressNotes } from '@/utils/actionPlanUtils';
import { ProgressNote } from '@/types/actionPlan';
import { toast } from 'sonner';

interface ProgressNotesListProps {
  descriptorId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ProgressNotesList: React.FC<ProgressNotesListProps> = ({
  descriptorId,
  isOpen,
  onClose
}) => {
  const [notes, setNotes] = useState<ProgressNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset notes when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setNotes([]);
    }
  }, [isOpen]);

  // Fetch notes when the modal opens with a valid descriptor ID
  useEffect(() => {
    if (isOpen && descriptorId) {
      console.log('Fetching notes for descriptor:', descriptorId);
      fetchNotes();
    }
  }, [isOpen, descriptorId]);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      console.log('Calling getProgressNotes for descriptor:', descriptorId);
      const result = await getProgressNotes(descriptorId);
      setIsLoading(false);

      if (result.success && result.data) {
        console.log('Fetched notes successfully:', result.data);
        setNotes(result.data);
      } else {
        console.error('Error fetching notes:', result.error);
        toast.error('Failed to load progress notes');
      }
    } catch (error) {
      console.error('Exception fetching notes:', error);
      setIsLoading(false);
      toast.error('An error occurred while loading notes');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Progress Notes</DialogTitle>
          <DialogDescription>
            View the history of progress notes for this action item.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">No progress notes yet</div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="border p-4 rounded-md">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {new Date(note.note_date).toLocaleString()}
                  </div>
                  <div className="whitespace-pre-wrap">{note.note_text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressNotesList;
