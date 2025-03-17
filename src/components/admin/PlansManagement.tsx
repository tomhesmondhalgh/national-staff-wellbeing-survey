
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { Plan } from '../../lib/supabase/subscription';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';

export function PlansManagement() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('sort_order');
        
      if (error) throw error;
      return data as Plan[];
    }
  });

  const updatePlan = async (plan: Plan) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({
          name: plan.name,
          description: plan.description,
          price: plan.price,
          is_active: plan.is_active,
          is_popular: plan.is_popular,
          stripe_price_id: plan.stripe_price_id,
          features: plan.features,
        })
        .eq('id', plan.id);
        
      if (error) throw error;
      
      toast.success('Plan updated successfully');
      refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
    setIsDialogOpen(true);
  };

  const handleFeatureChange = (index: number, value: string) => {
    if (!editingPlan) return;
    
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    
    setEditingPlan({
      ...editingPlan,
      features: newFeatures
    });
  };

  const addFeature = () => {
    if (!editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, ""]
    });
  };

  const removeFeature = (index: number) => {
    if (!editingPlan) return;
    
    const newFeatures = [...editingPlan.features];
    newFeatures.splice(index, 1);
    
    setEditingPlan({
      ...editingPlan,
      features: newFeatures
    });
  };

  if (isLoading) {
    return <div className="flex justify-center my-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Subscription Plans</h2>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map(plan => (
          <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-lg font-semibold">
                  {plan.currency === 'GBP' ? '£' : '$'}
                  {(plan.price / 100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-1">Type: {plan.purchase_type}</p>
                {plan.is_popular && <p className="text-xs font-medium text-green-600">Popular Plan</p>}
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium">Features:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  {plan.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="text-muted-foreground">{feature}</li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-muted-foreground">+{plan.features.length - 3} more</li>
                  )}
                </ul>
              </div>
              
              <Button 
                onClick={() => handleEditPlan(plan)} 
                className="w-full"
                variant="outline"
              >
                Edit Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input 
                    id="plan-name"
                    value={editingPlan.name}
                    onChange={e => setEditingPlan({...editingPlan, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="plan-price">Price (in pence)</Label>
                  <Input 
                    id="plan-price"
                    type="number"
                    value={editingPlan.price}
                    onChange={e => setEditingPlan({...editingPlan, price: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan-description">Description</Label>
                <Textarea 
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={e => setEditingPlan({...editingPlan, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-id">Stripe Price ID</Label>
                  <Input 
                    id="stripe-id"
                    value={editingPlan.stripe_price_id || ''}
                    onChange={e => setEditingPlan({...editingPlan, stripe_price_id: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purchase-type">Purchase Type</Label>
                  <Input 
                    id="purchase-type"
                    value={editingPlan.purchase_type || ''}
                    disabled
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-active"
                    checked={editingPlan.is_active}
                    onCheckedChange={checked => setEditingPlan({...editingPlan, is_active: checked})}
                  />
                  <Label htmlFor="is-active">Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="is-popular"
                    checked={editingPlan.is_popular}
                    onCheckedChange={checked => setEditingPlan({...editingPlan, is_popular: checked})}
                  />
                  <Label htmlFor="is-popular">Popular</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Features</Label>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={addFeature}
                    type="button"
                  >
                    Add Feature
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        value={feature}
                        onChange={e => handleFeatureChange(index, e.target.value)}
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        type="button"
                        onClick={() => removeFeature(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => updatePlan(editingPlan)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
