
import React from 'react';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface MultipleChoiceOptionsProps {
  options: string[];
  updateOption: (index: number, value: string) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
  maxOptions: number;
  errors: Record<string, string>;
}

const MultipleChoiceOptions: React.FC<MultipleChoiceOptionsProps> = ({
  options,
  updateOption,
  addOption,
  removeOption,
  maxOptions,
  errors
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Answer Options (Max {maxOptions})</Label>
        <Button 
          type="button" 
          size="sm"
          variant="outline"
          onClick={addOption}
          disabled={options.length >= maxOptions}
        >
          <Plus size={16} className="mr-1" /> Add Option
        </Button>
      </div>
      
      {errors.options && (
        <p className="text-red-500 text-sm">{errors.options}</p>
      )}
      
      <div className="space-y-3">
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className={errors[`option_${index}`] ? "border-red-500" : ""}
              maxLength={100}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOption(index)}
              disabled={options.length <= 1}
            >
              <Trash2 size={18} className="text-red-500" />
            </Button>
            {errors[`option_${index}`] && (
              <p className="text-red-500 text-sm absolute mt-10">{errors[`option_${index}`]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultipleChoiceOptions;
