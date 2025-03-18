
/**
 * Utility functions for converting between database and application types
 */

// Fix plan types in data from database
export const fixPlanTypes = (plans: any[]) => {
  return plans.map(plan => ({
    ...plan,
    price: Number(plan.price) || 0,
    sort_order: Number(plan.sort_order) || 0,
    duration_months: Number(plan.duration_months) || 0,
    is_popular: Boolean(plan.is_popular),
    is_active: Boolean(plan.is_active),
    features: Array.isArray(plan.features) ? plan.features : []
  }));
};

// Convert database custom question format to application type
export const fixCustomQuestionTypes = (questions: any[]) => {
  return questions.map(question => ({
    ...question,
    type: question.type || 'text',
    options: Array.isArray(question.options) ? question.options : [],
    archived: Boolean(question.archived)
  }));
};

// Convert organization members to application type
export const convertOrganizationMembers = (members: any[]) => {
  return members.map(member => ({
    ...member,
    is_primary: Boolean(member.is_primary),
    created_at: member.created_at || new Date().toISOString(),
    updated_at: member.updated_at || new Date().toISOString()
  }));
};

// Fix school search results type conversion
export const fixSchoolSearchResults = (schools: any[]) => {
  return schools.map(school => ({
    ...school,
    URN: String(school.URN),
    County: school["County (name)"] || ''
  }));
};
