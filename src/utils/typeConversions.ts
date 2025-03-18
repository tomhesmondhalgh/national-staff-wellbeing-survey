
/**
 * Type conversion utilities to safely convert database objects to application types
 */

import { CustomQuestion } from '../types/customQuestions';

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
