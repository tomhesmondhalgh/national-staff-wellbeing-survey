
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { saveAsTemplate } from '@/utils/actionPlanUtils';

interface SaveTemplateDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  userId,
  isOpen,
  onClose
}) => {
  const [templateName, setTemplateName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setIsSubmitting(true);
    const result = await saveAsTemplate(userId, templateName);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Template saved successfully');
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
            This will save your current action plan as a template for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter a name for this template..."
            className="mt-2"
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
