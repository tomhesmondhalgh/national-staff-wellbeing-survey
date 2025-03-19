
// Type definitions for subscription-related functionality
export type PlanType = 'free' | 'foundation' | 'progress' | 'premium' | 'enterprise';

export interface SubscriptionAccess {
  plan: PlanType;
  isActive: boolean;
}
