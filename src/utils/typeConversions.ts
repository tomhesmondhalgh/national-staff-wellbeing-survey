
import { CustomQuestion, convertToCustomQuestion } from '../types/customQuestions';
import { TeamMember, convertToTeamMembers } from '../components/team/types';
import { Plan, Subscription } from '../lib/supabase/subscription';

// Helper for fixing custom question types
export function fixCustomQuestionTypes(data: any[]): CustomQuestion[] {
  if (!Array.isArray(data)) return [];
  return data.map(convertToCustomQuestion);
}

// Helper for fixing team member types
export function fixTeamMemberTypes(data: any[], type: 'member' | 'invitation'): TeamMember[] {
  if (!Array.isArray(data)) return [];
  return convertToTeamMembers(data, type);
}

// Helper for ensuring Plan objects have correct purchase_type
export function fixPlanTypes(plans: any[]): Plan[] {
  if (!Array.isArray(plans)) return [];
  
  return plans.map(plan => ({
    ...plan,
    features: Array.isArray(plan.features) ? plan.features : [],
    purchase_type: (plan.purchase_type === 'subscription' || plan.purchase_type === 'one-time') 
      ? plan.purchase_type 
      : null
  })) as Plan[];
}

// Helper for ensuring Subscription objects have correct purchase_type
export function fixSubscriptionTypes(subscriptions: any[]): Subscription[] {
  if (!Array.isArray(subscriptions)) return [];
  
  return subscriptions.map(sub => ({
    ...sub,
    purchase_type: (sub.purchase_type === 'subscription' || sub.purchase_type === 'one-time') 
      ? sub.purchase_type 
      : 'subscription'
  })) as Subscription[];
}

// Helper to convert numeric URN to string for SchoolSearchResult
export function fixSchoolSearchResults(schools: any[]): any[] {
  if (!Array.isArray(schools)) return [];
  
  return schools.map(school => ({
    ...school,
    URN: school.URN.toString(),
    County: school.County ? school.County : school["County (name)"] || ''
  }));
}
