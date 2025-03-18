
/**
 * Type conversion utilities to safely convert database objects to application types
 */

import { CustomQuestion } from '../types/customQuestions';
import { Plan } from '../lib/supabase/subscription';

// Helper function to convert database custom questions to our application type
export function fixCustomQuestionTypes(dbQuestions: any[]): CustomQuestion[] {
  if (!Array.isArray(dbQuestions)) return [];
  
  return dbQuestions.map((q) => ({
    id: q.id,
    text: q.text,
    type: 'text' as const, // Force as 'text' type
    creator_id: q.creator_id,
    archived: !!q.archived,
    options: q.options || [],
    created_at: q.created_at
  }));
}

// Helper function to fix school search results URN from number to string
export function fixSchoolSearchResults(results: any[]): any[] {
  if (!Array.isArray(results)) return [];
  
  return results.map(school => ({
    ...school,
    URN: school.URN ? String(school.URN) : '',
    County: school['County (name)'] || ''
  }));
}

// Helper function to convert database organization members to our application type
export function convertOrganizationMembers(members: any[]): any[] {
  if (!Array.isArray(members)) return [];
  return members.map(member => ({
    id: member.id || `member-${Date.now()}-${Math.random()}`,
    user_id: member.user_id,
    organization_id: member.organization_id,
    role: member.role,
    is_primary: !!member.is_primary,
    created_at: member.created_at || new Date().toISOString(),
    updated_at: member.updated_at || new Date().toISOString()
  }));
}

// Helper function to fix plan types in database responses
export function fixPlanTypes(dbPlans: any[]): Plan[] {
  if (!Array.isArray(dbPlans)) return [];
  
  return dbPlans.map(plan => ({
    id: plan.id,
    name: plan.name || '',
    description: plan.description || '',
    price: plan.price || 0,
    currency: plan.currency || 'GBP',
    purchase_type: (plan.purchase_type === 'subscription' || plan.purchase_type === 'one-time') 
      ? plan.purchase_type 
      : 'subscription',
    duration_months: plan.duration_months || 12,
    created_at: plan.created_at || new Date().toISOString(),
    updated_at: plan.updated_at || new Date().toISOString(),
    stripe_price_id: plan.stripe_price_id || '',
    features: Array.isArray(plan.features) ? plan.features : [],
    is_popular: !!plan.is_popular,
    is_active: !!plan.is_active,
    sort_order: plan.sort_order || 0
  }));
}
