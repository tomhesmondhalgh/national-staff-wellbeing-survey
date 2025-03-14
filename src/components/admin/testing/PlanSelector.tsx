
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../ui/select';
import { PlanType } from '../../../lib/supabase/subscription';

interface PlanSelectorProps {
  selectedPlan: PlanType;
  onPlanChange: (value: PlanType) => void;
}

export function PlanSelector({ selectedPlan, onPlanChange }: PlanSelectorProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="plan-select" className="text-sm font-medium">Subscription Plan:</label>
      <Select 
        value={selectedPlan} 
        onValueChange={(value) => onPlanChange(value as PlanType)}
      >
        <SelectTrigger id="plan-select">
          <SelectValue placeholder="Select a plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="free">Free</SelectItem>
          <SelectItem value="foundation">Foundation</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
          <SelectItem value="premium">Premium</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
