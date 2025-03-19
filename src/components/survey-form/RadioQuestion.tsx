
import React from 'react';
import { cn } from '../../lib/utils';
import { Slider } from '../ui/slider';

interface RadioQuestionProps { 
  label: string; 
  name: string; 
  options: string[]; 
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  useSlider?: boolean;
}

const RadioQuestion: React.FC<RadioQuestionProps> = ({ 
  label, 
  name, 
  options, 
  value,
  onChange,
  error,
  required = true,
  useSlider = false
}) => {
  if (useSlider && options.every(opt => !isNaN(Number(opt)))) {
    const handleSliderChange = (newValue: number[]) => {
      const event = {
        target: {
          name,
          value: String(newValue[0])
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    };

    const currentValue = value ? parseInt(value) : 0;
    const minValue = parseInt(options[0]);
    const maxValue = parseInt(options[options.length - 1]);

    return (
      <div className="mb-10">
        <fieldset>
          <legend className="text-lg font-medium mb-3 text-left">
            {label} {required && <span className="text-red-500">*</span>}
          </legend>
          <div className="px-4 py-6">
            <Slider 
              defaultValue={[currentValue]} 
              max={maxValue} 
              min={minValue} 
              step={1} 
              value={[currentValue]}
              onValueChange={handleSliderChange}
              className="mb-2"
            />
            <div className="flex justify-between mt-2">
              {options.map((option, index) => (
                <div key={option} className="text-center">
                  <span className={cn(
                    "text-sm", 
                    value === option ? "font-bold text-brandPurple-600" : "text-gray-600"
                  )}>
                    {option}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
        </fieldset>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <fieldset>
        <legend className="text-lg font-medium mb-3 text-left">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>
        <div className="flex flex-wrap gap-2 text-left">
          {options.map((option) => (
            <div 
              key={option} 
              className={cn(
                "flex items-center mb-2 p-3 rounded-md transition-all border flex-1",
                value === option
                  ? "bg-brandPurple-100 border-brandPurple-400 shadow-sm" 
                  : "hover:bg-gray-50 border-gray-200"
              )}
            >
              <input
                type="radio"
                id={`${name}-${option}`}
                name={name}
                value={option}
                checked={value === option}
                onChange={onChange}
                className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
              />
              <label htmlFor={`${name}-${option}`} className="ml-2 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
                {option}
              </label>
            </div>
          ))}
        </div>
        {error && <p className="text-red-500 text-sm mt-1 text-left">{error}</p>}
      </fieldset>
    </div>
  );
};

export default RadioQuestion;
