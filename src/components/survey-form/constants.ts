
// Define options for different question types
export const roleOptions = [
  'Senior Leader', 
  'Middle or Team Leader', 
  'Teacher / Trainer', 
  'Teaching Assistant', 
  'Support Staff', 
  'Governor', 
  'Other', 
  'Prefer Not to Say'
];

export const agreementOptions = [
  'Strongly Agree',
  'Agree',
  'Disagree',
  'Strongly Disagree'
];

export const frequencyOptions = [
  'Never',
  'Rarely',
  'Sometimes',
  'Often',
  'All the Time'
];

// Define the standard survey questions
export const QUESTIONS = [
  {
    field: 'health_state',
    question: 'How would you describe your current mental wellbeing?',
    options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very Poor']
  },
  {
    field: 'leaving_contemplation',
    question: 'How often do you contemplate leaving your current role?',
    options: frequencyOptions
  }
];

// Define the rating questions (1-10 scale)
export const RATING_QUESTIONS = [
  {
    field: 'confidence_in_role',
    question: 'How confident do you feel in your role? (1 = Not at all, 10 = Very confident)'
  },
  {
    field: 'support_access',
    question: 'How easily can you access mental health support if needed? (1 = Very difficult, 10 = Very easy)'
  },
  {
    field: 'valued_member',
    question: 'How valued do you feel as a member of your team? (1 = Not at all, 10 = Highly valued)'
  },
  {
    field: 'work_life_balance',
    question: 'How would you rate your work-life balance? (1 = Poor, 10 = Excellent)'
  },
  {
    field: 'manageable_workload',
    question: 'How manageable is your current workload? (1 = Unmanageable, 10 = Very manageable)'
  },
  {
    field: 'leadership_prioritize',
    question: 'How much does leadership prioritize staff wellbeing? (1 = Not at all, 10 = Highest priority)'
  },
  {
    field: 'org_pride',
    question: 'How proud are you to work for your organization? (1 = Not at all, 10 = Very proud)'
  },
  {
    field: 'recommendation_score',
    question: 'How likely are you to recommend your workplace to others? (1 = Very unlikely, 10 = Very likely)'
  }
];

export const initialFormData = {
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
};

export type SurveyFormData = typeof initialFormData;
