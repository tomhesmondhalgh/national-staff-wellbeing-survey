import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar } from "lucide-react";
import { DatePicker } from "../components/ui/date-picker";
import { format } from 'date-fns';
import { toast } from "sonner";
import { useAuth } from '../../contexts/AuthContext';
import { createSurveyTemplate, sendSurveyEmails } from '../../utils/surveyUtils';
import { addQuestionsToSurvey, getUserCustomQuestions } from '../../utils/customQuestionsUtils';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import QuestionsList from '../questions/QuestionsList';
import { CustomQuestion } from '../../types/customQuestions';

const formSchema = z.object({
  name: z.string().min(3, {
    message: "Survey name must be at least 3 characters.",
  }),
  date: z.date(),
  close_date: z.date().optional(),
  emails: z.string().optional(),
});

const SurveyForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [survey, setSurvey] = useState<any>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      date: new Date(),
      close_date: null,
      emails: ''
    },
  });

  useEffect(() => {
    if (survey) {
      setValue('name', survey.name);
      setValue('date', new Date(survey.date));
      setValue('close_date', survey.close_date ? new Date(survey.close_date) : null);
      setValue('emails', survey.emails || '');
    }
  }, [survey, setValue]);

  const fetchCustomQuestions = async () => {
    if (!user) return;
    
    try {
      setIsLoadingQuestions(true);
      const questions = await getUserCustomQuestions();
      setCustomQuestions(questions);
    } catch (error) {
      console.error('Error loading custom questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  useEffect(() => {
    fetchCustomQuestions();
  }, [user]);

  const handleDateChange = (date: Date | undefined) => {
    setValue('date', date || new Date());
  };

  const handleCloseDateChange = (date: Date | undefined) => {
    setValue('close_date', date);
  };

  const handleSelectQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    } else {
      setSelectedQuestions(prev => [...prev, questionId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = formData.get('name') as string;
    const date = formData.get('date') as string;
    const close_date = formData.get('close_date') as string;
    const emails = formData.get('emails') as string;
    
    if (!name || !date) {
      toast.error("Please fill out all required fields.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const parsedDate = new Date(date);
      const parsedCloseDate = close_date ? new Date(close_date) : null;
      
      // Create survey template
      const createdSurvey = await createSurveyTemplate(
        name,
        parsedDate.toISOString(),
        parsedCloseDate ? parsedCloseDate.toISOString() : null,
        emails
      );
      
      if (!createdSurvey) {
        toast.error("Failed to create survey. Please try again.");
        return;
      }
      
      // Send emails
      if (emails) {
        const emailList = emails.split(',').map(email => email.trim());
        await sendSurveyEmails(createdSurvey.id, name, emailList);
      }
      
      // Add custom questions to the survey
      if (createdSurvey && selectedQuestions.length > 0) {
        const addQuestionsResult = await addQuestionsToSurvey(createdSurvey.id, selectedQuestions);
        if (!addQuestionsResult) {
          toast.error("Failed to add custom questions to the survey");
        }
      }
      
      // Reset form
      (e.currentTarget as HTMLFormElement).reset();
      setSurvey(null);
      
      toast.success("Survey created successfully!", {
        description: "Redirecting to surveys page..."
      });
      
      setTimeout(() => {
        navigate('/surveys');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Survey Name</Label>
            <Input
              type="text"
              id="name"
              placeholder="Enter survey name"
              required
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="emails">Recipient Emails</Label>
            <Input
              type="email"
              id="emails"
              placeholder="Enter recipient emails, separated by commas"
              {...register("emails")}
            />
            <p className="text-gray-500 text-sm mt-1">Separate multiple emails with commas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>
              Start Date
            </Label>
            <DatePicker
              onSelect={handleDateChange}
              defaultMonth={new Date()}
              mode="single"
            >
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(), "PPP")}
              </Button>
            </DatePicker>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>
          
          <div>
            <Label>
              Close Date (Optional)
            </Label>
            <DatePicker
              onSelect={handleCloseDateChange}
              defaultMonth={new Date()}
              mode="single"
            >
              <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {format(new Date(), "PPP")}
              </Button>
            </DatePicker>
            {errors.close_date && (
              <p className="text-red-500 text-sm mt-1">{errors.close_date.message}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Custom Questions</h3>
          <p className="text-gray-600 mb-4">
            Add your custom questions to this survey. These will appear at the end of the standard questions.
          </p>
          
          {selectedQuestions.length > 0 ? (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Questions:</h4>
              <div className="grid gap-2">
                {selectedQuestions.map(id => {
                  const question = customQuestions.find(q => q.id === id);
                  return question ? (
                    <div key={id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                      <div>
                        <p className="font-medium">{question.text}</p>
                        <p className="text-xs text-gray-500">
                          {question.type === 'text' ? 'Text Response' : 'Dropdown Selection'}
                        </p>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSelectQuestion(id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          ) : (
            <p className="text-amber-600 text-sm mb-4">No custom questions selected.</p>
          )}
          
          <div className="flex space-x-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setShowQuestionsDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Questions
            </Button>
            
            <Button
              type="button"
              variant="link"
              onClick={() => navigate('/questions')}
            >
              Manage Questions
            </Button>
          </div>
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Survey...' : 'Create Survey'}
        </Button>
        
        {/* Custom Questions Dialog */}
        <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Custom Questions</DialogTitle>
              <DialogDescription>
                Select questions to add to your survey.
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingQuestions ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading questions...</p>
              </div>
            ) : customQuestions.length > 0 ? (
              <QuestionsList
                questions={customQuestions}
                onUpdate={fetchCustomQuestions}
                isSelectable
                selectedQuestions={selectedQuestions}
                onSelectQuestion={handleSelectQuestion}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any custom questions yet.</p>
                <Button onClick={() => navigate('/questions')}>
                  Create Questions
                </Button>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionsDialog(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </div>
  );
};

export default SurveyForm;
