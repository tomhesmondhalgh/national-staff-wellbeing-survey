
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PageTitle from '../components/ui/PageTitle';
import { useToast } from '../components/ui/use-toast';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

// Define options for different question types
const roleOptions = [
  'Senior Leader', 
  'Middle or Team Leader', 
  'Teacher / Trainer', 
  'Teaching Assistant', 
  'Support Staff', 
  'Governor', 
  'Other', 
  'Prefer Not to Say'
];

const agreementOptions = [
  'Strongly Agree',
  'Agree',
  'Disagree',
  'Strongly Disagree'
];

const frequencyOptions = [
  'Never',
  'Rarely',
  'Sometimes',
  'Often',
  'All the Time'
];

const SurveyForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Get survey_template_id from URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const surveyId = searchParams.get('id');
  
  // If no survey ID is provided, we'll show an error
  const [surveyNotFound, setSurveyNotFound] = useState(false);
  const [surveyTemplate, setSurveyTemplate] = useState<any>(null);
  
  useEffect(() => {
    async function fetchSurveyTemplate() {
      if (!surveyId) {
        setSurveyNotFound(true);
        return;
      }
      
      try {
        console.log("Fetching survey with ID:", surveyId);
        
        const { data, error } = await supabase
          .from('survey_templates')
          .select('*')
          .eq('id', surveyId)
          .maybeSingle(); // Using maybeSingle instead of single to handle not found case better
          
        if (error) {
          console.error('Error fetching survey template:', error);
          setSurveyNotFound(true);
          return;
        }
        
        if (!data) {
          console.error('No survey found with ID:', surveyId);
          setSurveyNotFound(true);
          return;
        }
        
        console.log("Survey found:", data);
        setSurveyTemplate(data);
        
        // Check if survey is closed
        if (data.close_date && new Date(data.close_date) < new Date()) {
          navigate('/survey-closed');
        }
      } catch (error) {
        console.error('Error:', error);
        setSurveyNotFound(true);
      }
    }
    
    fetchSurveyTemplate();
  }, [surveyId, navigate]);
  
  const [formData, setFormData] = useState({
    role: '',
    leadershipPrioritize: '',
    manageableWorkload: '',
    workLifeBalance: '',
    healthState: '',
    valuedMember: '',
    supportAccess: '',
    confidenceInRole: '',
    orgPride: '',
    recommendationScore: '',
    leavingContemplation: '',
    doingWell: '',
    improvements: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scrollPosition, setScrollPosition] = useState(0);

  // Save scroll position before input change
  useEffect(() => {
    const handleScroll = () => {
      if (formRef.current) {
        setScrollPosition(window.scrollY);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position after state update
  useEffect(() => {
    if (scrollPosition > 0) {
      window.scrollTo(0, scrollPosition);
    }
  }, [formData, scrollPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Store current scroll position before state update
    if (e.target.tagName.toLowerCase() === 'textarea') {
      setScrollPosition(window.scrollY);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
    
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
    
    // Check each required field
    Object.entries(formData).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = 'This field is required';
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
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit response to Supabase with the survey_template_id
      const { error } = await supabase
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
        }]);
          
      if (error) {
        console.error('Error submitting survey response:', error);
        throw error;
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

  // Radio selection component to reduce repetition
  const RadioQuestion = ({ 
    label, 
    name, 
    options, 
    required = true 
  }: { 
    label: string; 
    name: string; 
    options: string[]; 
    required?: boolean;
  }) => (
    <div className="mb-10">
      <fieldset>
        <legend className="text-lg font-medium mb-3 text-left">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:space-x-4 text-left">
          {options.map((option) => (
            <div key={option} className="flex items-center mb-2">
              <input
                type="radio"
                id={`${name}-${option}`}
                name={name}
                value={option}
                checked={formData[name as keyof typeof formData] === option}
                onChange={handleInputChange}
                className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
              />
              <label htmlFor={`${name}-${option}`} className="ml-2 text-sm text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
        {errors[name] && <p className="text-red-500 text-sm mt-1 text-left">{errors[name]}</p>}
      </fieldset>
    </div>
  );

  // Number rating component
  const RatingQuestion = ({ 
    label, 
    name, 
    min, 
    max,
    required = true 
  }: { 
    label: string; 
    name: string; 
    min: number; 
    max: number;
    required?: boolean;
  }) => (
    <div className="mb-10">
      <fieldset>
        <legend className="text-lg font-medium mb-3 text-left">
          {label} {required && <span className="text-red-500">*</span>}
        </legend>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 text-left">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((num) => (
            <div key={num} className="flex flex-col items-center">
              <input
                type="radio"
                id={`${name}-${num}`}
                name={name}
                value={num}
                checked={formData[name as keyof typeof formData] === num.toString()}
                onChange={handleInputChange}
                className="h-4 w-4 text-brandPurple-600 focus:ring-brandPurple-500 border-gray-300"
              />
              <label htmlFor={`${name}-${num}`} className="mt-1 text-sm text-gray-700">
                {num}
              </label>
            </div>
          ))}
        </div>
        {errors[name] && <p className="text-red-500 text-sm mt-1 text-left">{errors[name]}</p>}
      </fieldset>
    </div>
  );

  // Text area component
  const TextQuestion = ({ 
    label, 
    name, 
    subtitle,
    required = true 
  }: { 
    label: string; 
    name: string; 
    subtitle?: string;
    required?: boolean;
  }) => (
    <div className="mb-10">
      <label htmlFor={name} className="block text-lg font-medium mb-2 text-left">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {subtitle && <p className="text-sm text-gray-600 mb-2 text-left">{subtitle}</p>}
      <textarea
        id={name}
        name={name}
        rows={4}
        value={formData[name as keyof typeof formData]}
        onChange={handleInputChange}
        className={cn(
          "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brandPurple-500 focus:border-transparent",
          errors[name] ? "border-red-500" : "border-gray-300"
        )}
      />
      {errors[name] && <p className="text-red-500 text-sm mt-1 text-left">{errors[name]}</p>}
    </div>
  );

  if (surveyNotFound) {
    return (
      <MainLayout>
        <div className="page-container max-w-4xl mx-auto px-4 py-8">
          <PageTitle 
            title="Survey Not Found" 
          />
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <p className="text-gray-700 mb-6">
              The survey you are looking for could not be found or has expired.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Go Home
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="page-container max-w-4xl mx-auto px-4 py-8">
        <PageTitle 
          title={surveyTemplate?.name ? surveyTemplate.name : "Complete the National Staff Wellbeing Survey"}
        />
        
        <div className="mb-8 text-left">
          <p className="text-gray-700">
            Completing this survey will only take around 5 minutes, but it will give your school or college 
            crucial information that will help them improve the wellbeing of staff. You'll also be helping to 
            improve staff wellbeing on a national level. This is an anonymous survey, please do not include 
            any personal identifiable data.
          </p>
        </div>
        
        <div ref={formRef} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit}>
            {/* Role Selection Dropdown */}
            <div className="mb-10">
              <label htmlFor="role" className="block text-lg font-medium mb-2 text-left">
                What's Your Role Within School or College? <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={cn(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brandPurple-500 focus:border-transparent",
                  errors.role ? "border-red-500" : "border-gray-300"
                )}
              >
                <option value="">Select your role</option>
                {roleOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-sm mt-1 text-left">{errors.role}</p>}
            </div>
            
            {/* Agreement Scale Questions */}
            <RadioQuestion 
              label="Leadership prioritise staff wellbeing in our organisation" 
              name="leadershipPrioritize" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I have a manageable workload" 
              name="manageableWorkload" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I have a good work-life balance" 
              name="workLifeBalance" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I am in good physical and mental health" 
              name="healthState" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I feel a valued member of the team" 
              name="valuedMember" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I know where to get support when needed and feel confident to do so" 
              name="supportAccess" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I feel confident performing my role and am given opportunities to grow" 
              name="confidenceInRole" 
              options={agreementOptions} 
            />
            
            <RadioQuestion 
              label="I am proud to be part of this organisation" 
              name="orgPride" 
              options={agreementOptions} 
            />
            
            {/* Numeric Rating */}
            <RatingQuestion 
              label="On a Scale of 1-10 How Likely Are You to Recommend This Organisation to Others as a Great Place to Work?" 
              name="recommendationScore" 
              min={1} 
              max={10} 
            />
            
            {/* Frequency Question */}
            <RadioQuestion 
              label="In the last 6 months I have contemplated leaving my role" 
              name="leavingContemplation" 
              options={frequencyOptions} 
            />
            
            {/* Text Questions */}
            <TextQuestion 
              label="Thinking about staff wellbeing, what does your organisation do well?" 
              name="doingWell" 
              subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
            />
            
            <TextQuestion 
              label="Thinking about staff wellbeing, what could your organisation do better?" 
              name="improvements" 
              subtitle="This is an anonymous survey, please do not include any personal identifiable data." 
            />
            
            <div className="mt-10 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "btn-primary min-w-[200px] py-3",
                  isSubmitting && "opacity-70 cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Submitting..." : "Submit Survey"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default SurveyForm;
