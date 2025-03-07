
import React, { useEffect, useState } from 'react';
import { SurveyFormData } from '../components/surveys/SurveyForm';
import SurveyIntro from '../components/survey-form/SurveyIntro';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import RoleSelect from '../components/survey-form/RoleSelect';
import RadioQuestion from '../components/survey-form/RadioQuestion';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import SubmitButton from '../components/survey-form/SubmitButton';
import { roleOptions } from '../components/survey-form/constants';

const SurveyPreview = () => {
  const [surveyData, setSurveyData] = useState<SurveyFormData | null>(null);
  const [formState, setFormState] = useState({
    role: '',
    worklife: '',
    wellbeing: '',
    recommendation: '5',
    feedback: '',
  });

  useEffect(() => {
    // Retrieve the preview data from sessionStorage
    const storedData = sessionStorage.getItem('previewSurveyData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setSurveyData(parsedData);
      } catch (e) {
        console.error('Error parsing survey preview data:', e);
      }
    }
  }, []);

  // Mock form handlers that don't actually submit anything
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormState(prev => ({ ...prev, recommendation: value }));
  };

  if (!surveyData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 sm:p-10">
          <SurveyNotFound />
          <p className="text-center text-gray-600 mt-4">Preview data not found. Please go back and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 sm:p-10">
        <div className="text-center mb-4">
          <div className="inline-block p-2 bg-brandPurple-100 rounded-full mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16V12" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8H12.01" stroke="#6C47FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">PREVIEW MODE</h2>
          <p className="mt-2 text-gray-600">This is a preview of how your survey will appear to respondents</p>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <SurveyIntro surveyTemplate={{ name: surveyData.name }} />
          
          <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
            <RoleSelect 
              value={formState.role}
              onChange={handleChange}
              options={roleOptions}
            />
            
            <RadioQuestion
              label="How would you rate your work-life balance?"
              name="worklife"
              options={["Very Poor", "Poor", "Average", "Good", "Excellent"]}
              value={formState.worklife}
              onChange={handleChange}
            />
            
            <RadioQuestion
              label="How would you rate your overall wellbeing at work?"
              name="wellbeing"
              options={["Very Poor", "Poor", "Average", "Good", "Excellent"]}
              value={formState.wellbeing}
              onChange={handleChange}
            />
            
            <RatingQuestion
              label="How likely are you to recommend this organization to others?"
              name="recommendation"
              min={1}
              max={10}
              value={formState.recommendation}
              onChange={handleRatingChange}
            />
            
            <TextQuestion
              label="Do you have any suggestions to improve wellbeing in your workplace?"
              name="feedback"
              value={formState.feedback}
              onChange={handleChange}
              required={false}
            />
            
            <SubmitButton isSubmitting={false} />
          </form>
        </div>
      </div>
    </div>
  );
};

export default SurveyPreview;
