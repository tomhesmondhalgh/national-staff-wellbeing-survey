
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
    // Handle all possible input types
    let numCount = 0;
    
    if (typeof count === 'number') {
      // If it's already a number, use it directly
      numCount = count;
    } else if (count !== null && count !== undefined) {
      // For objects or any other non-null type, try to get a numeric value
      try {
        if (typeof count === 'object' && count !== null) {
          // If it has a count property (from aggregate query)
          if ('count' in count) {
            numCount = Number((count as any).count) || 0;
          }
        } else {
          // Try to convert to number as last resort
          numCount = Number(count) || 0;
        }
      } catch (error) {
        console.error('Error formatting note count:', error);
        numCount = 0;
      }
    }
    
    // Ensure it's a valid number
    numCount = isNaN(numCount) ? 0 : numCount;
    
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
