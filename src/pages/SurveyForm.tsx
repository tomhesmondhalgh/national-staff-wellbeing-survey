
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from 'lucide-react';
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { DatePicker } from "../components/ui/date-picker"
import { toast } from "sonner";
import { useAuth } from '../contexts/AuthContext';
import { getSurveyById } from '../utils/surveyUtils';
import CustomQuestions from '../components/survey-form/CustomQuestions';
import { getSurveyCustomQuestions, submitCustomQuestionResponses } from '../utils/customQuestionsUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Plus } from 'lucide-react';
import QuestionsList from '../components/questions/QuestionsList';
import { getUserCustomQuestions, addQuestionsToSurvey } from '../utils/customQuestionsUtils';
import { CustomQuestion } from '../types/customQuestions';
import { supabase } from '../lib/supabase';

const SurveyForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');

  const [survey, setSurvey] = useState<any>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
  const [emails, setEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  const [emailsError, setEmailsError] = useState('');
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [customQuestionValues, setCustomQuestionValues] = useState<Record<string, string>>({});
  const [customQuestionErrors, setCustomQuestionErrors] = useState<Record<string, string>>({});
  const [currentSurvey, setCurrentSurvey] = useState<any>(null);

  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) return;

      try {
        const surveyData = await getSurveyById(surveyId);
        if (surveyData) {
          setSurvey(surveyData);
          setName(surveyData.name);
          setDate(surveyData.date ? new Date(surveyData.date) : undefined);
          setCloseDate(surveyData.close_date ? new Date(surveyData.close_date) : undefined);
          // Check if emails property exists before setting it
          if ('emails' in surveyData) {
            setEmails(surveyData.emails || '');
          }
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        toast.error("Failed to load survey");
      }
    };

    loadSurvey();
  }, [surveyId]);

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

  // Load custom questions for this survey
  useEffect(() => {
    const loadCustomQuestions = async () => {
      if (!survey) return;
      
      try {
        const questions = await getSurveyCustomQuestions(survey.id);
        setCustomQuestions(questions);
      } catch (error) {
        console.error('Error loading custom questions:', error);
      }
    };
    
    loadCustomQuestions();
  }, [survey]);

  const validateForm = () => {
    let isValid = true;
    setNameError('');
    setDateError('');
    setEmailsError('');

    if (!name.trim()) {
      setNameError('Survey name is required');
      isValid = false;
    }

    if (!date) {
      setDateError('Survey date is required');
      isValid = false;
    }

    if (emails.trim() && !emails.split(',').every(email => email.trim().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))) {
      setEmailsError('Please enter a valid comma-separated list of email addresses');
      isValid = false;
    }

    return isValid;
  };

  const handleSelectQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    } else {
      setSelectedQuestions(prev => [...prev, questionId]);
    }
  };

  const handleCustomQuestionChange = (id: string, value: string) => {
    setCustomQuestionValues(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear any error for this field when the user changes the value
    if (customQuestionErrors[id]) {
      setCustomQuestionErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validateCustomQuestions = () => {
    const errors: Record<string, string> = {};
    let isValid = true;
    
    customQuestions.forEach(question => {
      // Required validation for all custom questions
      if (!customQuestionValues[question.id] || !customQuestionValues[question.id].trim()) {
        errors[question.id] = 'This field is required';
        isValid = false;
      }
    });
    
    setCustomQuestionErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the standard form fields
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Validate custom questions
    if (customQuestions.length > 0 && !validateCustomQuestions()) {
      // Scroll to the custom questions section
      document.querySelector('.custom-questions-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formattedDate = date ? date.toISOString() : '';
      const formattedCloseDate = closeDate ? closeDate.toISOString() : null;

      // Create or update the survey template
      let surveyResult;
      if (surveyId) {
        // Update existing survey
        const { data, error } = await supabase
          .from('survey_templates')
          .update({
            name: name.trim(),
            date: formattedDate,
            close_date: formattedCloseDate,
            emails: emails.trim()
          })
          .eq('id', surveyId)
          .select()
          .single();
          
        if (error) throw error;
        surveyResult = data;
      } else {
        // Create new survey
        const { data, error } = await supabase
          .from('survey_templates')
          .insert({
            name: name.trim(),
            date: formattedDate,
            close_date: formattedCloseDate,
            emails: emails.trim(),
            creator_id: user?.id
          })
          .select()
          .single();
          
        if (error) throw error;
        surveyResult = data;
      }

      if (!surveyResult) {
        toast.error("Failed to create survey");
        return;
      }
      
      // Add custom questions to the survey
      if (surveyResult && selectedQuestions.length > 0) {
        const addQuestionsResult = await addQuestionsToSurvey(surveyResult.id, selectedQuestions);
        if (!addQuestionsResult) {
          toast.error("Failed to add custom questions to the survey");
        }
      }

      const responseId = surveyResult.id;
      
      // Submit custom question responses
      if (responseId && customQuestions.length > 0) {
        const customResponses = Object.entries(customQuestionValues).map(([questionId, answer]) => ({
          questionId,
          answer
        }));
        
        await submitCustomQuestionResponses(responseId, customResponses);
      }

      // Send emails to recipients
      if (emails.trim()) {
        const emailList = emails.split(',').map(email => email.trim());
        
        // Call the Edge Function to send emails
        const { error: emailError } = await supabase.functions.invoke('send-survey-email', {
          body: {
            surveyId: surveyResult.id,
            surveyName: name.trim(),
            emails: emailList,
            surveyUrl: `${window.location.origin}/survey?id=${surveyResult.id}`,
            isReminder: false
          }
        });
        
        if (emailError) {
          console.error('Error sending emails:', emailError);
          toast.error("Survey created but emails could not be sent");
        } else {
          toast.success("Survey created and invitations sent");
        }
      }

      // Reset the form
      setName('');
      setDate(undefined);
      setCloseDate(undefined);
      setEmails('');
      setCustomQuestionValues({});
      setSelectedQuestions([]);

      toast.success("Survey created successfully!", {
        description: "Redirecting to surveys page..."
      });

      setTimeout(() => {
        navigate('/surveys');
      }, 1500);
    } catch (error) {
      console.error('Error creating survey:', error);
      toast.error("Failed to create survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name: fieldName, value } = e.target;
    if (fieldName === 'name') {
      setName(value);
    } else if (fieldName === 'emails') {
      setEmails(value);
    }
    
    // Update currentSurvey state with type safety
    setCurrentSurvey((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  return (
    <div className="page-container">
      <div className="card animate-slide-up">
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div>
            <Label htmlFor="name">Survey Name</Label>
            <Input
              type="text"
              id="name"
              placeholder="Enter survey name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </div>

          <div>
            <Label>Survey Date</Label>
            <DatePicker
              date={date}
              onDateChange={setDate}
            />
            {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
          </div>

          <div>
            <Label>Close Date (Optional)</Label>
            <DatePicker
              date={closeDate}
              onDateChange={setCloseDate}
            />
          </div>

          <div>
            <Label htmlFor="emails">Recipient Emails (comma-separated)</Label>
            <Textarea
              id="emails"
              placeholder="Enter recipient emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              rows={3}
            />
            {emailsError && <p className="text-red-500 text-sm mt-1">{emailsError}</p>}
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
          
          {/* Right before the submit button, add the custom questions section */}
          <div className="custom-questions-section">
            <CustomQuestions 
              questions={customQuestions}
              values={customQuestionValues}
              onChange={handleCustomQuestionChange}
              errors={customQuestionErrors}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Survey...' : 'Create Survey'}
          </Button>
        </form>
      </div>
      
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
    </div>
  );
};

export default SurveyForm;
