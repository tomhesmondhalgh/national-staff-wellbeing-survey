
import React, { useEffect, useState } from 'react';
import { SurveyFormData } from '../components/surveys/SurveyForm';
import SurveyIntro from '../components/survey-form/SurveyIntro';
import SurveyNotFound from '../components/survey-form/SurveyNotFound';
import RoleSelect from '../components/survey-form/RoleSelect';
import RadioQuestion from '../components/survey-form/RadioQuestion';
import RatingQuestion from '../components/survey-form/RatingQuestion';
import TextQuestion from '../components/survey-form/TextQuestion';
import SubmitButton from '../components/survey-form/SubmitButton';
import { roleOptions, agreementOptions, frequencyOptions } from '../components/survey-form/constants';
import { SurveyTemplate } from '../utils/surveyUtils';

const SurveyPreview = () => {
  const [surveyData, setSurveyData] = useState<SurveyFormData | null>(null);
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
    setFormState(prev => ({ ...prev, recommendationScore: value }));
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

  // Create a complete SurveyTemplate object with all required properties
  const surveyTemplate: SurveyTemplate = {
    id: 'preview',
    name: surveyData.name,
    date: surveyData.date ? new Date(surveyData.date).toISOString() : new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'Scheduled'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Preview mode banner */}
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

        {/* Main content area */}
        <div className="page-container max-w-4xl mx-auto px-4 py-8">
          <SurveyIntro surveyTemplate={surveyTemplate} />
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <form onSubmit={(e) => e.preventDefault()}>
              {/* Role Selection Dropdown */}
              <RoleSelect 
                value={formState.role}
                onChange={handleChange}
                options={roleOptions}
              />
              
              {/* Agreement Scale Questions */}
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
              
              {/* Numeric Rating */}
              <RatingQuestion 
                label="On a Scale of 1-10 How Likely Are You to Recommend This Organisation to Others as a Great Place to Work?" 
                name="recommendationScore" 
                min={1} 
                max={10}
                value={formState.recommendationScore}
                onChange={handleRatingChange}
              />
              
              {/* Frequency Question */}
              <RadioQuestion 
                label="In the last 6 months I have contemplated leaving my role" 
                name="leavingContemplation" 
                options={frequencyOptions}
                value={formState.leavingContemplation}
                onChange={handleChange}
              />
              
              {/* Text Questions */}
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
              
              <SubmitButton isSubmitting={false} />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyPreview;
