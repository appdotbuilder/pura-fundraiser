import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, User, DollarSign, MessageCircle, MapPin } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateDonationInput, Pura } from '../../../server/src/schema';

interface DonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pura: Pura;
  onDonationCreated: () => void;
}

export function DonateDialog({ open, onOpenChange, pura, onDonationCreated }: DonateDialogProps) {
  const [formData, setFormData] = useState<CreateDonationInput>({
    pura_id: pura.id,
    donor_name: '',
    amount: 0,
    message: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      await trpc.createDonation.mutate({
        ...formData,
        pura_id: pura.id
      });
      
      onDonationCreated();
      
      // Reset form
      setFormData({
        pura_id: pura.id,
        donor_name: '',
        amount: 0,
        message: null
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create donation:', error);
      // In a real app, you'd show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const suggestedAmounts = [50000, 100000, 250000, 500000, 1000000];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-800">
            <Heart className="h-5 w-5" />
            Make a Donation
          </DialogTitle>
          <DialogDescription>
            Support the preservation of this sacred temple with your generous donation.
          </DialogDescription>
        </DialogHeader>

        {/* Pura Info Card */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{pura.name}</h3>
            <div className="flex items-center text-sm text-gray-600 gap-1 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{pura.location}</span>
            </div>
            <div className="text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Progress:</span>
                <span className="font-medium">
                  {formatCurrency(pura.current_amount)} / {formatCurrency(pura.target_amount)}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {Math.min((pura.current_amount / pura.target_amount) * 100, 100).toFixed(1)}% completed
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donor_name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Name
            </Label>
            <Input
              id="donor_name"
              placeholder="Enter your name"
              value={formData.donor_name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateDonationInput) => ({ ...prev, donor_name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Donation Amount (IDR)
            </Label>
            
            {/* Suggested amounts */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {suggestedAmounts.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev: CreateDonationInput) => ({ ...prev, amount }))}
                  className={formData.amount === amount ? 'bg-orange-100 border-orange-300' : ''}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>

            <Input
              id="amount"
              type="number"
              placeholder="Enter custom amount"
              value={formData.amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateDonationInput) => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))
              }
              min="1000"
              step="1000"
              required
            />
            <p className="text-xs text-gray-500">
              {formData.amount > 0 && (
                <>Amount: {formatCurrency(formData.amount)}</>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Share your prayers or message for this temple..."
              value={formData.message || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateDonationInput) => ({ 
                  ...prev, 
                  message: e.target.value || null 
                }))
              }
              rows={3}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is currently a demonstration. QRIS payment integration will be added in the future. 
              Your donation will be recorded for tracking purposes.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.donor_name || formData.amount <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Processing...' : `Donate ${formData.amount > 0 ? formatCurrency(formData.amount) : ''}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}