import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SurveyFormData } from '../components/surveys/SurveyForm';
import MainLayout from '../components/layout/MainLayout';
import SurveyIntro from '../components/survey-form/SurveyIntro';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import RoleSelect from '../components/survey-form/RoleSelect';
import RadioQuestion from '../components/survey-form/RadioQuestion';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import SubmitButton from '../components/survey-form/SubmitButton';
import { roleOptions, agreementOptions, frequencyOptions } from '../components/survey-form/constants';
import { SurveyTemplate, getSurveyById } from '../utils/surveyUtils';
import { supabase } from '../lib/supabase';
import { CustomQuestion } from '../types/customQuestions';
import CustomTextQuestion from '../components/survey-form/CustomTextQuestion';
import { useOrientation } from '../hooks/useOrientation';
import ScreenOrientationOverlay from '../components/ui/ScreenOrientationOverlay';

interface PreviewData extends SurveyFormData {
  customQuestionIds?: string[];
}

const SurveyForm = () => {
  const [surveyData, setSurveyData] = useState<SurveyTemplate | null>(null);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { orientation, isMobile } = useOrientation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const queryParams = new URLSearchParams(location.search);
  const surveyId = queryParams.get('id');
  const isPreview = queryParams.get('preview') === 'true';
  
  const [formState, setFormState] = useState({
    role: '',
    leadershipPrioritize: '',
    manageableWorkload: '',
    workLifeBalance: '',
    healthState: '',
    valuedMember: '',
    supportAccess: '',
    confidenceInRole: '',
    orgPride: '',
    recommendationScore: '5',
    leavingContemplation: '',
    doingWell: '',
    improvements: '',
    customAnswers: {} as Record<string, string>,
  });

  useEffect(() => {
    const loadSurveyData = async () => {
      setIsLoading(true);
      
      try {
        if (!surveyId) {
          setError('Survey ID is missing');
          setIsLoading(false);
          return;
        }
        
        const survey = await getSurveyById(surveyId);
        
        if (!survey) {
          setError('Survey not found');
          setIsLoading(false);
          return;
        }
        
        setSurveyData(survey);
        
        const { data: questionLinks, error: linksError } = await supabase
          .from('survey_questions')
          .select('question_id')
          .eq('survey_id', surveyId);
          
        if (linksError) {
          console.error('Error fetching question links:', linksError);
        } else if (questionLinks && questionLinks.length > 0) {
          const questionIds = questionLinks.map(link => link.question_id);
          
          console.log('Found question IDs:', questionIds);
          
          const { data: questions, error: questionsError } = await supabase
            .from('custom_questions')
            .select('*')
            .in('id', questionIds)
            .eq('archived', false);
            
          if (questionsError) {
            console.error('Error fetching custom questions:', questionsError);
          } else {
            console.log('Fetched custom questions:', questions);
            setCustomQuestions(questions || []);
          }
        }
      } catch (err) {
        console.error('Error loading survey:', err);
        setError('Error loading survey');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSurveyData();
  }, [surveyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('custom_')) {
      setFormState(prev => ({ 
        ...prev, 
        customAnswers: { 
          ...prev.customAnswers, 
          [name]: value 
        } 
      }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormState(prev => ({ ...prev, recommendationScore: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPreview) {
      alert('This is a preview. In the actual survey, responses would be recorded.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      navigate('/survey-complete');
    } catch (err) {
      console.error('Error submitting survey:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 sm:p-10">
            <div className="flex justify-center">
              <p>Loading survey...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !surveyData) {
    return (
      <MainLayout>
        <SurveyNotFound />
      </MainLayout>
    );
  }

  console.log('Rendering with custom questions:', customQuestions);

  return (
    <MainLayout>
      {isMobile && orientation === 'portrait' && (
        <ScreenOrientationOverlay />
      )}
      
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {isPreview && (
            <div className="bg-brandPurple-50 p-4 rounded-lg mb-6 text-center border border-brandPurple-200">
              <div className="inline-block p-2 bg-brandPurple-100 rounded-full mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">PREVIEW MODE</h2>
              <p className="text-gray-600">This is a preview of how your survey will appear to respondents</p>
            </div>
          )}

          <div className="page-container max-w-4xl mx-auto px-4 py-8">
            <SurveyIntro surveyTemplate={surveyData} />
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <form onSubmit={handleSubmit}>
                <RoleSelect 
                  value={formState.role}
                  onChange={handleChange}
                  options={roleOptions}
                />
                
                <RadioQuestion 
                  label="Leadership prioritise staff wellbeing in our organisation" 
                  name="leadershipPrioritize" 
                  options={agreementOptions}
                  value={formState.leadershipPrioritize}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I have a manageable workload" 
                  name="manageableWorkload" 
                  options={agreementOptions}
                  value={formState.manageableWorkload}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I have a good work-life balance" 
                  name="workLifeBalance" 
                  options={agreementOptions}
                  value={formState.workLifeBalance}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I am in good physical and mental health" 
                  name="healthState" 
                  options={agreementOptions}
                  value={formState.healthState}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I feel a valued member of the team" 
                  name="valuedMember" 
                  options={agreementOptions}
                  value={formState.valuedMember}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I know where to get support when needed and feel confident to do so" 
                  name="supportAccess" 
                  options={agreementOptions}
                  value={formState.supportAccess}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I feel confident performing my role and am given opportunities to grow" 
                  name="confidenceInRole" 
                  options={agreementOptions}
                  value={formState.confidenceInRole}
                  onChange={handleChange}
                />
                
                <RadioQuestion 
                  label="I am proud to be part of this organisation" 
                  name="orgPride" 
                  options={agreementOptions}
                  value={formState.orgPride}
                  onChange={handleChange}
                />
                
                <RatingQuestion 
                  label="On a Scale of 1-10 How Likely Are You to Recommend This Organisation to Others as a Great Place to Work?" 
                  name="recommendationScore" 
                  min={1} 
                  max={10}
                  value={formState.recommendationScore}
                  onChange={handleRatingChange}
                />
                
                <RadioQuestion 
                  label="In the last 6 months I have contemplated leaving my role" 
                  name="leavingContemplation" 
                  options={frequencyOptions}
                  value={formState.leavingContemplation}
                  onChange={handleChange}
                />
                
                <TextQuestion 
                  label="Thinking about staff wellbeing, what does your organisation do well?" 
                  name="doingWell"
                  value={formState.doingWell}
                  onChange={handleChange}
                  subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
                />
                
                <TextQuestion 
                  label="Thinking about staff wellbeing, what could your organisation do better?" 
                  name="improvements"
                  value={formState.improvements}
                  onChange={handleChange}
                  subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
                />
                
                {customQuestions.length > 0 && (
                  <div className="mt-8 mb-4">
                    <h3 className="text-lg font-semibold mb-6">Additional Questions</h3>
                    
                    {customQuestions.map((question) => (
                      <React.Fragment key={question.id}>
                        {question.type === 'text' ? (
                          <CustomTextQuestion
                            label={question.text}
                            name={`custom_${question.id}`}
                            value={formState.customAnswers[`custom_${question.id}`] || ''}
                            onChange={handleChange}
                            maxLength={1000}
                          />
                        ) : (
                          <CustomTextQuestion
                            label={question.text}
                            name={`custom_${question.id}`}
                            value={formState.customAnswers[`custom_${question.id}`] || ''}
                            onChange={handleChange}
                            maxLength={1000}
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
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyForm;
