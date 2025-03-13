
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { Plan } from '../../types/subscription';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Check, X, Pencil, Plus, Trash } from 'lucide-react';
import { useEditableCell } from '../../hooks/useEditableCell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function PlansManagement() {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: plans, isLoading } = useQuery({
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

  const updatePlanMutation = useMutation({
    mutationFn: async (plan: Plan) => {
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
          purchase_type: plan.purchase_type,
          duration_months: plan.duration_months,
          sort_order: plan.sort_order
        })
        .eq('id', plan.id);
        
      if (error) throw error;
      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan updated successfully');
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Error updating plan:', error);
      toast.error('Failed to update plan');
    }
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('plans')
        .insert([plan])
        .select();
        
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast.success('Plan created successfully');
      setIsDialogOpen(false);
      setIsCreating(false);
    },
    onError: (error) => {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    }
  });

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(JSON.parse(JSON.stringify(plan)));
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleCreatePlan = () => {
    setEditingPlan({
      name: '',
      description: '',
      price: 0,
      currency: 'GBP',
      purchase_type: 'subscription',
      duration_months: 12,
      stripe_price_id: null,
      features: [],
      is_popular: false,
      is_active: true,
      sort_order: plans ? Math.max(...plans.map(p => p.sort_order)) + 10 : 10
    } as Plan);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;
    
    if (isCreating) {
      const { id, created_at, updated_at, ...newPlan } = editingPlan;
      createPlanMutation.mutate(newPlan);
    } else {
      updatePlanMutation.mutate(editingPlan);
    }
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

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2
    }).format(price / 100);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Subscription Plans</h2>
        <Button onClick={handleCreatePlan}>
          <Plus className="mr-2 h-4 w-4" /> Create New Plan
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Popular</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans?.map(plan => (
              <TableRow key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
                <TableCell>{plan.sort_order}</TableCell>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{formatPrice(plan.price)}</TableCell>
                <TableCell>{plan.purchase_type}</TableCell>
                <TableCell>
                  {plan.is_active ? 
                    <div className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>Active</span>
                    </div> : 
                    <div className="flex items-center">
                      <X className="h-4 w-4 text-red-500 mr-1" />
                      <span>Inactive</span>
                    </div>
                  }
                </TableCell>
                <TableCell>
                  {plan.is_popular ? 
                    <Check className="h-4 w-4 text-green-500" /> : 
                    <X className="h-4 w-4 text-red-500" />
                  }
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{plan.features.length} items</span>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    onClick={() => handleEditPlan(plan)} 
                    variant="ghost"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Create New Plan' : 'Edit Plan'}</DialogTitle>
          </DialogHeader>
          
          {editingPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Select 
                    value={editingPlan.purchase_type}
                    onValueChange={(value) => setEditingPlan({...editingPlan, purchase_type: value as 'subscription' | 'one-time' | 'free'})}
                  >
                    <SelectTrigger id="purchase-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration-months">Duration (months)</Label>
                  <Input 
                    id="duration-months"
                    type="number"
                    value={editingPlan.duration_months || 0}
                    onChange={e => setEditingPlan({...editingPlan, duration_months: parseInt(e.target.value) || null})}
                    disabled={editingPlan.purchase_type === 'free'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sort-order">Sort Order</Label>
                  <Input 
                    id="sort-order"
                    type="number"
                    value={editingPlan.sort_order}
                    onChange={e => setEditingPlan({...editingPlan, sort_order: parseInt(e.target.value) || 0})}
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
                    <Plus className="h-4 w-4 mr-1" /> Add Feature
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
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePlan}
                  disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
                >
                  {updatePlanMutation.isPending || createPlanMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
