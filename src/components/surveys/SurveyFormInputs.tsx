
import React from 'react';
import { Calendar as CalendarIcon, Mail, Link } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { SurveyFormData } from './SurveyForm';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface SurveyFormInputsProps {
  form: UseFormReturn<SurveyFormData>;
}

const SurveyFormInputs: React.FC<SurveyFormInputsProps> = ({ form }) => {
  return (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Survey Name*</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Spring Term 2024 Survey"
                {...field}
              />
            </FormControl>
            <FormDescription>
              A descriptive name to help you identify this survey
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Survey Date*</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The date when the survey will be sent to staff
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="closeDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Close Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                The last day staff can respond to the survey
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={form.control}
        name="distributionMethod"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Distribution Method*</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value || "link"}
                value={field.value || "link"}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="link" id="distribution-link" />
                  <label htmlFor="distribution-link" className="flex items-center cursor-pointer">
                    <Link className="h-5 w-5 mr-2 text-gray-500" />
                    Use a Survey Link
                  </label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3">
                  <RadioGroupItem value="email" id="distribution-email" />
                  <label htmlFor="distribution-email" className="flex items-center cursor-pointer">
                    <Mail className="h-5 w-5 mr-2 text-gray-500" />
                    Send to Specific Email Addresses
                  </label>
                </div>
              </RadioGroup>
            </FormControl>
            <FormDescription>
              Choose how you want to distribute your survey
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {form.watch("distributionMethod") === "email" && (
        <FormField
          control={form.control}
          name="recipients"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Recipients</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <Textarea
                    placeholder="Enter email addresses, separated by commas"
                    className="pl-10"
                    rows={4}
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Enter staff email addresses, separated by commas
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
};

export default SurveyFormInputs;
