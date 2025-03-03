
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Calendar } from 'lucide-react';
import { DatePicker } from '../components/ui/date-picker';
import { format } from 'date-fns';
import { toast } from "sonner";
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getSurveyById } from '../utils/surveyUtils';
import { getSurveyCustomQuestions } from '../utils/customQuestionsUtils';

const EditSurvey = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [survey, setSurvey] = useState<any>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [loadingCustomQuestions, setLoadingCustomQuestions] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) {
        toast.error("Survey ID is required");
        return;
      }

      try {
        setLoading(true);
        const surveyData = await getSurveyById(surveyId);

        if (surveyData) {
          setSurvey(surveyData);
          setName(surveyData.name);
          setDate(surveyData.date ? new Date(surveyData.date) : undefined);
          setCloseDate(surveyData.close_date ? new Date(surveyData.close_date) : undefined);
          // Check if emails property exists before setting it
          setEmails(surveyData.emails || '');
        } else {
          toast.error("Survey not found");
          navigate('/surveys');
        }
      } catch (error) {
        console.error('Error fetching survey:', error);
        toast.error("Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId, navigate]);

  // Load custom questions for this survey
  useEffect(() => {
    const fetchCustomQuestions = async () => {
      if (!survey) return;
      
      try {
        setLoadingCustomQuestions(true);
        const questions = await getSurveyCustomQuestions(surveyId!);
        setCustomQuestions(questions);
      } catch (error) {
        console.error('Error fetching custom questions:', error);
        toast.error("Failed to load custom questions");
      } finally {
        setLoadingCustomQuestions(false);
      }
    };
    
    fetchCustomQuestions();
  }, [survey, surveyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Survey name is required");
      return;
    }

    if (!date) {
      toast.error("Survey date is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('survey_templates')
        .update({
          name: name.trim(),
          date: date.toISOString(),
          close_date: closeDate ? closeDate.toISOString() : null,
          emails: emails.trim()
        })
        .eq('id', surveyId);

      if (error) {
        throw error;
      }

      toast.success("Survey updated successfully");
      navigate('/surveys');
    } catch (error) {
      console.error('Error updating survey:', error);
      toast.error("Failed to update survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-container">
        <div className="flex justify-between items-center mb-8">
          <PageTitle
            title="Edit Survey"
            subtitle="Update your survey details"
            className="mb-0 text-left"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading survey details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card animate-slide-up">
            <div className="grid gap-6">
              <div>
                <Label htmlFor="name">Survey Name</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter survey name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label>
                  Launch Date
                </Label>
                <DatePicker
                  date={date}
                  onDateChange={setDate}
                />
              </div>

              <div>
                <Label>
                  Closing Date (Optional)
                </Label>
                <DatePicker
                  date={closeDate}
                  onDateChange={setCloseDate}
                />
              </div>

              <div>
                <Label htmlFor="emails">
                  Recipient Emails (Comma Separated)
                </Label>
                <Input
                  type="email"
                  id="emails"
                  placeholder="Enter recipient emails, separated by commas"
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                />
              </div>
            </div>
            
            {/* Add custom questions section before the form submit buttons */}
            <div className="mt-8 border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Custom Questions</h3>
              
              {loadingCustomQuestions ? (
                <div className="text-center py-4">
                  <div className="animate-spin h-5 w-5 border-4 border-brandPurple-500 border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading custom questions...</p>
                </div>
              ) : customQuestions.length > 0 ? (
                <div className="space-y-4">
                  {customQuestions.map(question => (
                    <div key={question.id} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <p className="font-medium">{question.text}</p>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          question.type === 'text' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {question.type === 'text' ? 'Text Response' : 'Dropdown Selection'}
                        </span>
                        
                        {question.type === 'dropdown' && question.options && (
                          <span className="ml-2">
                            {question.options.length} {question.options.length === 1 ? 'option' : 'options'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No custom questions have been added to this survey.</p>
              )}
              
              <div className="mt-4">
                <p className="text-sm text-amber-600">
                  Note: Custom questions cannot be modified after a survey has been created.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/surveys')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Survey'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
};

export default EditSurvey;
