
import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface SurveyBasicFieldsProps {
  name: string;
  emails: string;
  onNameChange: (value: string) => void;
  onEmailsChange: (value: string) => void;
  nameError?: string;
  emailsError?: string;
}

const SurveyBasicFields: React.FC<SurveyBasicFieldsProps> = ({
  name,
  emails,
  onNameChange,
  onEmailsChange,
  nameError,
  emailsError
}) => {
  return (
    <>
      <div>
        <Label htmlFor="name">Survey Name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Enter survey name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
      </div>

      <div>
        <Label htmlFor="emails">Recipient Emails (comma-separated)</Label>
        <Textarea
          id="emails"
          name="emails"
          placeholder="Enter recipient emails"
          value={emails}
          onChange={(e) => onEmailsChange(e.target.value)}
          rows={3}
        />
        {emailsError && <p className="text-red-500 text-sm mt-1">{emailsError}</p>}
      </div>
    </>
  );
};

export default SurveyBasicFields;
