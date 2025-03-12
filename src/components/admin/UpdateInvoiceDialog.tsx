
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { supabase } from '../../lib/supabase';
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Purchase } from './PurchasesManagement';
import { formatCurrency } from '../../lib/utils';

interface UpdateInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  purchase: Purchase;
  onUpdated: () => void;
}

export function UpdateInvoiceDialog({ 
  open, 
  onClose, 
  purchase, 
  onUpdated 
}: UpdateInvoiceDialogProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(purchase.invoice_number || '');
  const [status, setStatus] = useState(purchase.payment_status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      console.log('Submitting invoice update:', {
        paymentId: purchase.id,
        status,
        invoiceNumber
      });

      // Call the Edge Function to update the invoice status
      const { data, error } = await supabase.functions.invoke('update-invoice-status', {
        body: {
          paymentId: purchase.id,
          status: status,
          invoiceNumber: invoiceNumber,
          adminUserId: 'admin' // This is just for logging purposes
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setErrorMessage(error.message || 'Failed to update invoice');
        throw new Error(error.message || 'Failed to update invoice');
      }

      console.log('Update response:', data);

      // Show success message and close the dialog
      toast.success("Invoice updated successfully");
      onUpdated();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice', { 
        description: errorMessage || error.message || 'Please try again later'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Invoice</DialogTitle>
          <DialogDescription>
            Update invoice details and payment status
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">School</Label>
              <div className="font-medium">{purchase.billing_school_name || 'Not provided'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="font-medium">{formatCurrency(purchase.amount, purchase.currency)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Contact</Label>
              <div className="font-medium">{purchase.billing_contact_name || 'Not provided'}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <div className="font-medium">{purchase.billing_contact_email || 'Not provided'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Enter invoice number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Payment Status</Label>
            <Select
              value={status}
              onValueChange={(value: 'pending' | 'completed' | 'cancelled') => setStatus(value)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    Completed
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    Cancelled
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Address</Label>
            <div className="text-sm bg-gray-50 p-2 rounded">
              {purchase.billing_address || 'No address provided'}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 
                          status === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isSubmitting ? 'Updating...' : 'Update Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
