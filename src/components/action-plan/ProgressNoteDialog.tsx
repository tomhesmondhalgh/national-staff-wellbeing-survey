
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addProgressNote } from '@/utils/actionPlanUtils';

interface ProgressNoteDialogProps {
  descriptorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ProgressNoteDialog: React.FC<ProgressNoteDialogProps> = ({
  descriptorId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!noteText.trim()) {
      toast.error('Please enter a note');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Adding progress note for descriptor:', descriptorId);
      const result = await addProgressNote(descriptorId, noteText);
      
      if (result.success) {
        console.log('Note added successfully');
        toast.success('Progress note added');
        setNoteText('');
        onSuccess();
        onClose();
      } else {
        console.error('Error adding note:', result.error);
        toast.error('Failed to add note');
      }
    } catch (error) {
      console.error('Exception adding note:', error);
      toast.error('An error occurred while saving the note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the note text when the dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setNoteText('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Progress Note</DialogTitle>
          <DialogDescription>
            Record your progress or updates for this action item.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Enter details about progress made, challenges encountered, or next steps..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={5}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressNoteDialog;
