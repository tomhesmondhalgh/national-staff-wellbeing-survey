
import React from 'react';
import { Label } from '../ui/label';
import { DatePicker } from "../ui/date-picker";

interface SurveyDateFieldsProps {
  date: Date | undefined;
  closeDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  onCloseDateChange: (date: Date | undefined) => void;
  dateError?: string;
}

const SurveyDateFields: React.FC<SurveyDateFieldsProps> = ({
  date,
  closeDate,
  onDateChange,
  onCloseDateChange,
  dateError
}) => {
  return (
    <>
      <div>
        <Label>Survey Date</Label>
        <DatePicker
          date={date}
          onDateChange={onDateChange}
        />
        {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
      </div>

      <div>
        <Label>Close Date (Optional)</Label>
        <DatePicker
          date={closeDate}
          onDateChange={onCloseDateChange}
        />
      </div>
    </>
  );
};

export default SurveyDateFields;
