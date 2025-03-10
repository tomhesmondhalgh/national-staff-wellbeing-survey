
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';
import { getSurveyById, isSurveyClosed, SurveyTemplate } from '../utils/surveyUtils';
import { useOrientation } from '../hooks/useOrientation';
import ScreenOrientationOverlay from '../components/ui/ScreenOrientationOverlay';

// Import refactored components
import RadioQuestion from '../components/survey-form/RadioQuestion';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import RoleSelect from '../components/survey-form/RoleSelect';
import SurveyIntro from '../components/survey-form/SurveyIntro';
import SurveyLoading from '../components/survey-form/SurveyLoading';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import SubmitButton from '../components/survey-form/SubmitButton';
import CustomTextQuestion from '../components/survey-form/CustomTextQuestion';
import CustomMultipleChoiceQuestion from '../components/survey-form/CustomMultipleChoiceQuestion';

// Import constants
import { 
  roleOptions, 
  agreementOptions, 
  frequencyOptions, 
  initialFormData,
  SurveyFormData
} from '../components/survey-form/constants';
import { CustomQuestion } from '../types/customQuestions';

const SurveyForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const { orientation, isMobile } = useOrientation();
  
  // Get survey_template_id from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const surveyId = searchParams.get('id');
  
  // If no survey ID is provided, we'll show an error
  const [surveyNotFound, setSurveyNotFound] = useState(false);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [surveyTemplate, setSurveyTemplate] = useState<SurveyTemplate | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  
  // Fetch the survey template when component mounts
  React.useEffect(() => {
    let isMounted = true;
    
    const fetchSurveyTemplate = async () => {
      if (!surveyId) {
        console.error('No survey ID provided in URL');
        if (isMounted) {
          setSurveyNotFound(true);
          setSurveyLoading(false);
        }
        return;
      }
      
      try {
        console.log(`Starting survey fetch process for ID: ${surveyId}`);
        
        // Use the utility function to get the survey
        const survey = await getSurveyById(surveyId);
        
        // If component unmounted during async operation, do nothing
        if (!isMounted) return;
        
        if (!survey) {
          console.error(`Survey with ID ${surveyId} was not found`);
          setSurveyNotFound(true);
          setSurveyLoading(false);
          return;
        }
        
        console.log('Survey retrieved successfully:', survey);
        
        // Check if survey is closed
        if (isSurveyClosed(survey)) {
          console.log('Survey is closed, redirecting to closed page');
          navigate('/survey-closed');
          return;
        }
        
        // Set survey template data
        setSurveyTemplate(survey);
        
        // Fetch custom questions if any
        await fetchCustomQuestions(surveyId);
        
        setSurveyLoading(false);
      } catch (error) {
        console.error('Error in fetchSurveyTemplate:', error);
        if (isMounted) {
          setSurveyNotFound(true);
          setSurveyLoading(false);
        }
      }
    };
    
    fetchSurveyTemplate();
    
    // Clean up function to prevent state updates if component unmounts
    return () => {
      isMounted = false;
    };
  }, [surveyId, navigate]);
  
  const fetchCustomQuestions = async (surveyTemplateId: string) => {
    try {
      // First get the question IDs linked to this survey
      const { data: linkData, error: linkError } = await supabase
        .from('survey_custom_questions')
        .select('question_id')
        .eq('survey_id', surveyTemplateId);
      
      if (linkError) {
        throw linkError;
      }
      
      if (!linkData || linkData.length === 0) {
        // No custom questions for this survey
        return;
      }
      
      // Extract question IDs
      const questionIds = linkData.map(item => item.question_id);
      
      // Fetch the actual questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('custom_questions')
        .select('*')
        .in('id', questionIds)
        .eq('archived', false);
      
      if (questionsError) {
        throw questionsError;
      }
      
      setCustomQuestions(questionsData || []);
      
      // Initialize custom answers
      if (questionsData) {
        const customAnswersObj: Record<string, string> = {};
        questionsData.forEach(q => {
          customAnswersObj[`custom_${q.id}`] = '';
        });
        setFormData(prev => ({
          ...prev,
          customAnswers: customAnswersObj
        }));
      }
    } catch (error) {
      console.error('Error fetching custom questions:', error);
    }
  };
  
  // Initialize form data with standard fields
  const [formData, setFormData] = useState<SurveyFormData & { customAnswers: Record<string, string> }>({
    ...initialFormData,
    customAnswers: {}
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Check if this is a custom question answer
    if (name.startsWith('custom_')) {
      setFormData({
        ...formData,
        customAnswers: {
          ...formData.customAnswers,
          [name]: value
        }
      });
    } else {
      // Handle standard fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is populated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Check each required standard field
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'customAnswers' && !value.toString().trim()) {
        newErrors[key] = 'This field is required';
      }
    });
    
    // Check custom question answers
    customQuestions.forEach(question => {
      const answerKey = `custom_${question.id}`;
      if (!formData.customAnswers[answerKey]?.trim()) {
        newErrors[answerKey] = 'This field is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      
      // Scroll to the first error
      const firstErrorElement = document.querySelector('[class*="border-red-500"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log(`Submitting survey response for template ID: ${surveyId}`);
      
      // Submit standard response to Supabase
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert([{
          survey_template_id: surveyId,
          role: formData.role,
          leadership_prioritize: formData.leadershipPrioritize,
          manageable_workload: formData.manageableWorkload,
          work_life_balance: formData.workLifeBalance,
          health_state: formData.healthState,
          valued_member: formData.valuedMember,
          support_access: formData.supportAccess,
          confidence_in_role: formData.confidenceInRole,
          org_pride: formData.orgPride,
          recommendation_score: formData.recommendationScore,
          leaving_contemplation: formData.leavingContemplation,
          doing_well: formData.doingWell,
          improvements: formData.improvements
        }])
        .select()
        .single();
          
      if (responseError) {
        throw responseError;
      }
      
      // Submit custom question responses
      if (customQuestions.length > 0) {
        const customResponses = customQuestions.map(question => ({
          question_id: question.id,
          answer: formData.customAnswers[`custom_${question.id}`] || '',
          response_id: responseData.id,
          survey_id: surveyId
        }));
        
        const { error: customResponseError } = await supabase
          .from('custom_question_responses')
          .insert(customResponses);
          
        if (customResponseError) {
          console.error('Error submitting custom responses:', customResponseError);
          // We'll still proceed even if custom responses fail
        }
      }
      
      toast({
        title: "Survey Submitted",
        description: "Thank you for completing the wellbeing survey!",
        variant: "default"
      });
      
      // Navigate to the thank you page
      navigate('/survey-complete');
      
    } catch (error: any) {
      console.error('Survey submission error:', error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (surveyLoading) {
    return <SurveyLoading />;
  }

  if (surveyNotFound) {
    return <SurveyNotFound />;
  }

  return (
    <MainLayout>
      {isMobile && orientation === 'portrait' && (
        <ScreenOrientationOverlay />
      )}
      
      <div className="page-container max-w-4xl mx-auto px-4 py-8">
        <SurveyIntro surveyTemplate={surveyTemplate} />
        
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* Role Selection Dropdown */}
            <RoleSelect 
              value={formData.role}
              onChange={handleInputChange}
              options={roleOptions}
              error={errors.role}
            />
            
            {/* Agreement Scale Questions */}
            <RadioQuestion 
              label="Leadership prioritise staff wellbeing in our organisation" 
              name="leadershipPrioritize" 
              options={agreementOptions}
              value={formData.leadershipPrioritize}
              onChange={handleInputChange}
              error={errors.leadershipPrioritize}
            />
            
            <RadioQuestion 
              label="I have a manageable workload" 
              name="manageableWorkload" 
              options={agreementOptions}
              value={formData.manageableWorkload}
              onChange={handleInputChange}
              error={errors.manageableWorkload}
            />
            
            <RadioQuestion 
              label="I have a good work-life balance" 
              name="workLifeBalance" 
              options={agreementOptions}
              value={formData.workLifeBalance}
              onChange={handleInputChange}
              error={errors.workLifeBalance}
            />
            
            <RadioQuestion 
              label="I am in good physical and mental health" 
              name="healthState" 
              options={agreementOptions}
              value={formData.healthState}
              onChange={handleInputChange}
              error={errors.healthState}
            />
            
            <RadioQuestion 
              label="I feel a valued member of the team" 
              name="valuedMember" 
              options={agreementOptions}
              value={formData.valuedMember}
              onChange={handleInputChange}
              error={errors.valuedMember}
            />
            
            <RadioQuestion 
              label="I know where to get support when needed and feel confident to do so" 
              name="supportAccess" 
              options={agreementOptions}
              value={formData.supportAccess}
              onChange={handleInputChange}
              error={errors.supportAccess}
            />
            
            <RadioQuestion 
              label="I feel confident performing my role and am given opportunities to grow" 
              name="confidenceInRole" 
              options={agreementOptions}
              value={formData.confidenceInRole}
              onChange={handleInputChange}
              error={errors.confidenceInRole}
            />
            
            <RadioQuestion 
              label="I am proud to be part of this organisation" 
              name="orgPride" 
              options={agreementOptions}
              value={formData.orgPride}
              onChange={handleInputChange}
              error={errors.orgPride}
            />
            
            {/* Numeric Rating */}
            <RatingQuestion 
              label="On a Scale of 1-10 How Likely Are You to Recommend This Organisation to Others as a Great Place to Work?" 
              name="recommendationScore" 
              min={1} 
              max={10}
              value={formData.recommendationScore}
              onChange={handleInputChange}
              error={errors.recommendationScore}
            />
            
            {/* Frequency Question */}
            <RadioQuestion 
              label="In the last 6 months I have contemplated leaving my role" 
              name="leavingContemplation" 
              options={frequencyOptions}
              value={formData.leavingContemplation}
              onChange={handleInputChange}
              error={errors.leavingContemplation}
            />
            
            {/* Text Questions */}
            <TextQuestion 
              label="Thinking about staff wellbeing, what does your organisation do well?" 
              name="doingWell"
              value={formData.doingWell}
              onChange={handleInputChange}
              error={errors.doingWell}
              subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
            />
            
            <TextQuestion 
              label="Thinking about staff wellbeing, what could your organisation do better?" 
              name="improvements"
              value={formData.improvements}
              onChange={handleInputChange}
              error={errors.improvements}
              subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
            />
            
            {/* Custom Questions */}
            {customQuestions.length > 0 && (
              <div className="mt-8 mb-4">
                <h3 className="text-lg font-semibold mb-6">Additional Questions</h3>
                
                {customQuestions.map((question) => (
                  <React.Fragment key={question.id}>
                    {question.type === 'text' ? (
                      <CustomTextQuestion
                        label={question.text}
                        name={`custom_${question.id}`}
                        value={formData.customAnswers[`custom_${question.id}`] || ''}
                        onChange={handleInputChange}
                        error={errors[`custom_${question.id}`]}
                      />
                    ) : (
                      <CustomMultipleChoiceQuestion
                        label={question.text}
                        name={`custom_${question.id}`}
                        options={question.options || []}
                        value={formData.customAnswers[`custom_${question.id}`] || ''}
                        onChange={handleInputChange}
                        error={errors[`custom_${question.id}`]}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            
            <SubmitButton isSubmitting={isSubmitting} />
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyForm;
