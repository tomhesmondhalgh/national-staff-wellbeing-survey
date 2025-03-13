
export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  purchase_type: 'subscription' | 'one-time' | 'free';
  duration_months: number | null;
  stripe_price_id: string | null;
  features: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface BillingDetails {
  schoolName: string;
  address: string;
  contactName: string;
  contactEmail: string;
}

export type PurchaseType = 'subscription' | 'one-time' | 'free';
