
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import SurveyIntro from '../components/survey-form/SurveyIntro';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import RadioQuestion from '../components/survey-form/RadioQuestion';
import SubmitButton from '../components/survey-form/SubmitButton';
import SurveyLoading from '../components/survey-form/SurveyLoading';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import SurveyClosed from '../pages/SurveyClosed';
import CustomTextQuestion from '../components/survey-form/CustomTextQuestion';
import { getSurveyById } from '../utils/survey/templates';
import { isSurveyClosed } from '../utils/survey/status';

const PublicSurveyForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const surveyId = searchParams.get('id');
  const isPreview = searchParams.get('preview') === 'true';
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surveyName, setSurveyName] = useState('Wellbeing Survey');
  const [surveyData, setSurveyData] = useState<any>(null);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    role: '',
    leadership_prioritize: '',
    manageable_workload: '',
    work_life_balance: '',
    health_state: '',
    valued_member: '',
    support_access: '',
    confidence_in_role: '',
    org_pride: '',
    recommendation_score: '',
    leaving_contemplation: '',
    doing_well: '',
    improvements: '',
    custom_responses: {} as Record<string, string>
  });
  
  useEffect(() => {
    if (!surveyId) {
      setIsLoading(false);
      return;
    }
    
    const fetchSurveyData = async () => {
      try {
        // Fetch survey template data
        const surveyTemplate = await getSurveyById(surveyId);
        
        if (!surveyTemplate) {
          console.error('Survey not found');
          setIsLoading(false);
          return;
        }
        
        // Check if survey is closed and not in preview mode
        if (isSurveyClosed(surveyTemplate) && !isPreview) {
          navigate('/survey-closed');
          return;
        }
        
        setSurveyName(surveyTemplate.name);
        setSurveyData(surveyTemplate);
        
        // Fetch custom questions
        const { data: questionLinks, error: linksError } = await supabase
          .from('survey_questions')
          .select('question_id')
          .eq('survey_id', surveyId);
          
        if (linksError) {
          console.error('Error fetching question links:', linksError);
        }
        
        if (questionLinks && questionLinks.length > 0) {
          const questionIds = questionLinks.map(link => link.question_id);
          
          const { data: questions, error: questionsError } = await supabase
            .from('custom_questions')
            .select('*')
            .in('id', questionIds);
            
          if (questionsError) {
            console.error('Error fetching custom questions:', questionsError);
          } else if (questions) {
            setCustomQuestions(questions);
          }
        }
        
      } catch (error) {
        console.error('Error fetching survey data:', error);
        toast.error('Failed to load survey');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSurveyData();
  }, [surveyId, navigate, isPreview]);
  
  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };
  
  const handleCustomQuestionResponse = (questionId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_responses: {
        ...prev.custom_responses,
        [questionId]: value
      }
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!surveyId) {
      toast.error('Survey ID is missing');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // First save the main survey response
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_template_id: surveyId,
          role: formData.role,
          leadership_prioritize: formData.leadership_prioritize,
          manageable_workload: formData.manageable_workload,
          work_life_balance: formData.work_life_balance,
          health_state: formData.health_state,
          valued_member: formData.valued_member,
          support_access: formData.support_access,
          confidence_in_role: formData.confidence_in_role,
          org_pride: formData.org_pride,
          recommendation_score: formData.recommendation_score,
          leaving_contemplation: formData.leaving_contemplation,
          doing_well: formData.doing_well,
          improvements: formData.improvements
        })
        .select('id')
        .single();
      
      if (responseError) {
        throw responseError;
      }
      
      // Then save the custom question responses if any
      if (customQuestions.length > 0 && responseData) {
        const customResponses = Object.entries(formData.custom_responses).map(([questionId, answer]) => ({
          response_id: responseData.id,
          question_id: questionId,
          answer
        }));
        
        if (customResponses.length > 0) {
          const { error: customError } = await supabase
            .from('custom_question_responses')
            .insert(customResponses);
          
          if (customError) {
            console.error('Error saving custom responses:', customError);
          }
        }
      }
      
      // If not preview, redirect to completion page
      if (!isPreview) {
        navigate('/survey-complete');
      } else {
        toast.success('Preview form submitted successfully');
        setFormData({
          role: '',
          leadership_prioritize: '',
          manageable_workload: '',
          work_life_balance: '',
          health_state: '',
          valued_member: '',
          support_access: '',
          confidence_in_role: '',
          org_pride: '',
          recommendation_score: '',
          leaving_contemplation: '',
          doing_well: '',
          improvements: '',
          custom_responses: {}
        });
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error('Failed to submit survey');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return <SurveyLoading />;
  }
  
  if (!surveyId || !surveyData) {
    return <SurveyNotFound />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-white shadow-sm rounded-lg p-6 md:p-8">
          <SurveyIntro title={surveyName} />
          
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <RadioQuestion
              question="What is your role?"
              options={[
                'Teaching Staff',
                'Support Staff',
                'Middle Leadership',
                'Senior Leadership'
              ]}
              value={formData.role}
              onChange={(value) => handleInputChange('role', value)}
              required
            />
            
            <RatingQuestion
              question="Our leadership team prioritises staff wellbeing"
              value={formData.leadership_prioritize}
              onChange={(value) => handleInputChange('leadership_prioritize', value)}
              required
            />
            
            <RatingQuestion
              question="My workload is manageable"
              value={formData.manageable_workload}
              onChange={(value) => handleInputChange('manageable_workload', value)}
              required
            />
            
            <RatingQuestion
              question="I have a good work-life balance"
              value={formData.work_life_balance}
              onChange={(value) => handleInputChange('work_life_balance', value)}
              required
            />
            
            <RatingQuestion
              question="I am in good health"
              value={formData.health_state}
              onChange={(value) => handleInputChange('health_state', value)}
              required
            />
            
            <RatingQuestion
              question="I feel like a valued member of the team"
              value={formData.valued_member}
              onChange={(value) => handleInputChange('valued_member', value)}
              required
            />
            
            <RatingQuestion
              question="I have access to support when I need it"
              value={formData.support_access}
              onChange={(value) => handleInputChange('support_access', value)}
              required
            />
            
            <RatingQuestion
              question="I feel confident in my role"
              value={formData.confidence_in_role}
              onChange={(value) => handleInputChange('confidence_in_role', value)}
              required
            />
            
            <RatingQuestion
              question="I am proud to be part of this organisation"
              value={formData.org_pride}
              onChange={(value) => handleInputChange('org_pride', value)}
              required
            />
            
            <RadioQuestion
              question="How likely are you to recommend this school as a place to work to a friend or colleague?"
              options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
              scaleLabels={{
                min: 'Not at all likely',
                max: 'Extremely likely'
              }}
              displayAsScale
              value={formData.recommendation_score}
              onChange={(value) => handleInputChange('recommendation_score', value)}
              required
            />
            
            <RadioQuestion
              question="In the past 30 days, have you thought about leaving your current school?"
              options={['Yes', 'No']}
              value={formData.leaving_contemplation}
              onChange={(value) => handleInputChange('leaving_contemplation', value)}
              required
            />
            
            <TextQuestion
              question="What is your school doing well to support staff wellbeing?"
              value={formData.doing_well}
              onChange={(value) => handleInputChange('doing_well', value)}
              required
            />
            
            <TextQuestion
              question="What could your school do better to support staff wellbeing?"
              value={formData.improvements}
              onChange={(value) => handleInputChange('improvements', value)}
              required
            />
            
            {/* Custom Questions */}
            {customQuestions.length > 0 && (
              <div className="mt-12 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-6">Additional Questions</h3>
                <div className="space-y-8">
                  {customQuestions.map((question) => (
                    <CustomTextQuestion
                      key={question.id}
                      question={question.text}
                      value={formData.custom_responses[question.id] || ''}
                      onChange={(value) => handleCustomQuestionResponse(question.id, value)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            <div className="pt-6">
              <SubmitButton isSubmitting={isSubmitting} />
            </div>
          </form>
          
          {isPreview && (
            <div className="mt-8 pt-4 border-t border-gray-200">
              <div className="bg-yellow-50 p-4 rounded-md">
                <p className="text-yellow-700 text-sm font-medium">Preview Mode</p>
                <p className="text-yellow-600 text-sm mt-1">This is a preview of how your survey will appear to participants.</p>
              </div>
              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.close()}
                >
                  Close Preview
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicSurveyForm;
