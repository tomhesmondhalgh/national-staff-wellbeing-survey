
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ArchiveSurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  surveyName: string;
}

const ArchiveSurveyDialog: React.FC<ArchiveSurveyDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  surveyName,
}) => {
  const [isArchiving, setIsArchiving] = React.useState(false);

  const handleConfirm = async () => {
    setIsArchiving(true);
    try {
      await onConfirm();
    } finally {
      setIsArchiving(false);
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Survey</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive "{surveyName}"? This will hide it from the main surveys list.
            You can still access archived surveys by using filters.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isArchiving}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-red-600 hover:bg-red-700"
            disabled={isArchiving}
          >
            {isArchiving ? 'Archiving...' : 'Archive Survey'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ArchiveSurveyDialog;
