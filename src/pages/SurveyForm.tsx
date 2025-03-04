
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { getSurveyById, isSurveyClosed } from '../utils/surveyUtils';
import { getSurveyCustomQuestions } from '../utils/customQuestionsUtils';
import { supabase } from '../lib/supabase';
import { toast } from "sonner";
import SurveyIntro from '../components/survey-form/SurveyIntro';
import SurveyLoading from '../components/survey-form/SurveyLoading';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import RadioQuestion from '../components/survey-form/RadioQuestion';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import SubmitButton from '../components/survey-form/SubmitButton';
import RoleSelect from '../components/survey-form/RoleSelect';
import CustomQuestions from '../components/survey-form/CustomQuestions';
import { QUESTIONS, RATING_QUESTIONS } from '../components/survey-form/constants';

const SurveyForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const surveyId = searchParams.get('id');

  const [survey, setSurvey] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);

  // Form values
  const [formValues, setFormValues] = useState<Record<string, string>>({
    role: '',
    health_state: '',
    confidence_in_role: '',
    support_access: '',
    valued_member: '',
    work_life_balance: '',
    manageable_workload: '',
    leadership_prioritize: '',
    leaving_contemplation: '',
    org_pride: '',
    recommendation_score: '',
    doing_well: '',
    improvements: ''
  });

  // Custom question values
  const [customQuestionValues, setCustomQuestionValues] = useState<Record<string, string>>({});
  
  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [customQuestionErrors, setCustomQuestionErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSurvey = async () => {
      if (!surveyId) {
        setError("No survey ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const surveyData = await getSurveyById(surveyId);
        
        if (surveyData) {
          setSurvey(surveyData);
          
          // Check if survey is closed
          if (isSurveyClosed(surveyData)) {
            navigate('/survey-closed');
            return;
          }
          
          // Load custom questions for this survey
          const questions = await getSurveyCustomQuestions(surveyId);
          setCustomQuestions(questions);
        } else {
          setError("Survey not found");
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        setError(`Failed to load survey: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    loadSurvey();
  }, [surveyId, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormValues({
      ...formValues,
      [field]: value
    });
    
    // Clear error when user inputs a value
    if (formErrors[field]) {
      const newErrors = { ...formErrors };
      delete newErrors[field];
      setFormErrors(newErrors);
    }
  };

  const handleCustomQuestionChange = (id: string, value: string) => {
    setCustomQuestionValues({
      ...customQuestionValues,
      [id]: value
    });
    
    // Clear error when user inputs a value
    if (customQuestionErrors[id]) {
      const newErrors = { ...customQuestionErrors };
      delete newErrors[id];
      setCustomQuestionErrors(newErrors);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const customErrors: Record<string, string> = {};
    let isValid = true;

    // Check required fields
    if (!formValues.role) {
      errors.role = 'Please select your role';
      isValid = false;
    }
    
    // Validate rating questions
    RATING_QUESTIONS.forEach(question => {
      if (!formValues[question.field]) {
        errors[question.field] = 'Please provide a rating';
        isValid = false;
      }
    });

    // Validate custom questions
    customQuestions.forEach(question => {
      if (!customQuestionValues[question.id] || !customQuestionValues[question.id].trim()) {
        customErrors[question.id] = 'This field is required';
        isValid = false;
      }
    });

    setFormErrors(errors);
    setCustomQuestionErrors(customErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please complete all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First, insert the main survey response
      const { data: responseData, error: responseError } = await supabase
        .from('survey_responses')
        .insert({
          survey_template_id: surveyId,
          role: formValues.role,
          health_state: formValues.health_state,
          confidence_in_role: formValues.confidence_in_role,
          support_access: formValues.support_access,
          valued_member: formValues.valued_member,
          work_life_balance: formValues.work_life_balance,
          manageable_workload: formValues.manageable_workload,
          leadership_prioritize: formValues.leadership_prioritize,
          leaving_contemplation: formValues.leaving_contemplation,
          org_pride: formValues.org_pride,
          recommendation_score: formValues.recommendation_score,
          doing_well: formValues.doing_well,
          improvements: formValues.improvements
        })
        .select('id')
        .single();
      
      if (responseError) {
        throw responseError;
      }
      
      // Then, insert custom question responses if there are any
      if (customQuestions.length > 0 && responseData.id) {
        const customResponses = customQuestions.map(question => ({
          response_id: responseData.id,
          question_id: question.id,
          answer: customQuestionValues[question.id] || ''
        }));
        
        const { error: customError } = await supabase
          .from('custom_question_responses')
          .insert(customResponses);
        
        if (customError) {
          console.error('Error saving custom question responses:', customError);
          // Continue to completion page even if custom questions fail
        }
      }
      
      // Redirect to completion page
      navigate('/survey-complete');
    } catch (error) {
      console.error('Error submitting survey response:', error);
      toast.error("Failed to submit survey response");
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return <SurveyLoading />;
  }

  // Error state
  if (error) {
    return <SurveyNotFound error={error} />;
  }

  // Survey not found
  if (!survey) {
    return <SurveyNotFound />;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SurveyIntro name={survey.name} />
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <RoleSelect 
            value={formValues.role} 
            onChange={(value) => handleInputChange('role', value)} 
            error={formErrors.role}
          />
          
          {RATING_QUESTIONS.map((question) => (
            <RatingQuestion
              key={question.field}
              question={question.question}
              value={formValues[question.field]}
              onChange={(value) => handleInputChange(question.field, value)}
              error={formErrors[question.field]}
            />
          ))}
          
          {QUESTIONS.map((question) => (
            <RadioQuestion
              key={question.field}
              question={question.question}
              options={question.options}
              value={formValues[question.field]}
              onChange={(value) => handleInputChange(question.field, value)}
              error={formErrors[question.field]}
            />
          ))}
          
          <TextQuestion
            label="What is your organization doing well in terms of staff wellbeing?"
            placeholder="Please share your thoughts..."
            value={formValues.doing_well}
            onChange={(value) => handleInputChange('doing_well', value)}
            error={formErrors.doing_well}
          />
          
          <TextQuestion
            label="What improvements would you suggest to enhance staff wellbeing?"
            placeholder="Please share your suggestions..."
            value={formValues.improvements}
            onChange={(value) => handleInputChange('improvements', value)}
            error={formErrors.improvements}
          />
          
          {customQuestions.length > 0 && (
            <CustomQuestions
              questions={customQuestions}
              values={customQuestionValues}
              onChange={handleCustomQuestionChange}
              errors={customQuestionErrors}
            />
          )}
          
          <SubmitButton isSubmitting={submitting} />
        </form>
      </div>
    </div>
  );
};

export default SurveyForm;
