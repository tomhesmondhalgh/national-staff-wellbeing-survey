
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

interface NotesActionsProps {
  notesCount: number | null | undefined;
  onViewNotes: () => void;
  onAddNote: () => void;
}

const NotesActions: React.FC<NotesActionsProps> = ({
  notesCount,
  onViewNotes,
  onAddNote
}) => {
  // Format note count safely
  const formatNoteCount = (count: number | null | undefined) => {
    // Handle different possible types safely
    let numCount = 0;
    
    if (typeof count === 'number') {
      numCount = count;
    } else if (count && typeof count === 'object') {
      // Check if it's an object with a count property
      // Use optional chaining and type assertion for safety
      numCount = (count as { count?: number }).count || 0;
    }
    
    return `${numCount} ${numCount === 1 ? 'Note' : 'Notes'}`;
  };

  return (
    <div className="flex flex-col space-y-1">
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onViewNotes}
        className="h-7 px-2 text-xs w-full justify-start"
      >
        <FileText className="h-3 w-3 mr-1" />
        {formatNoteCount(notesCount)}
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={onAddNote}
        className="h-7 px-2 text-xs w-full justify-start"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add
      </Button>
    </div>
  );
};

export default NotesActions;
