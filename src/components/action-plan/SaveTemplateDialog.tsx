
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { saveAsTemplate } from '@/utils/actionPlanUtils';

interface SaveTemplateDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  section?: string; // Add section parameter
}

const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  userId,
  isOpen,
  onClose,
  section = 'General' // Default section if not provided
}) => {
  const [templateName, setTemplateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    const result = await saveAsTemplate(userId, section, templateName);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Template saved successfully'
      });
      setTemplateName('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current action plan as a template for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateDialog;
