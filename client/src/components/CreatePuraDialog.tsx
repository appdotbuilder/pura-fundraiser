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
import { MapPin, Target, FileText, Building } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreatePuraInput, Pura } from '../../../server/src/schema';

interface CreatePuraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPuraCreated: (pura: Pura) => void;
}

export function CreatePuraDialog({ open, onOpenChange, onPuraCreated }: CreatePuraDialogProps) {
  const [formData, setFormData] = useState<CreatePuraInput>({
    name: '',
    location: '',
    description: '',
    target_amount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const newPura = await trpc.createPura.mutate(formData);
      onPuraCreated(newPura);
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        description: '',
        target_amount: 0
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create pura:', error);
      // In a real app, you'd show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-800">
            <Building className="h-5 w-5" />
            Register New Pura
          </DialogTitle>
          <DialogDescription>
            Register a sacred Hindu temple to start fundraising for its preservation and maintenance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Pura Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Pura Besakih, Pura Tanah Lot"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePuraInput) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="e.g., Karangasem, Tabanan, Denpasar"
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePuraInput) => ({ ...prev, location: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target Amount (IDR)
            </Label>
            <Input
              id="target_amount"
              type="number"
              placeholder="e.g., 50000000"
              value={formData.target_amount || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreatePuraInput) => ({ 
                  ...prev, 
                  target_amount: parseFloat(e.target.value) || 0 
                }))
              }
              min="1"
              step="1000"
              required
            />
            <p className="text-xs text-gray-500">
              {formData.target_amount > 0 && (
                <>Target: {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(formData.target_amount)}</>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the temple, its significance, and what the funds will be used for..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreatePuraInput) => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              required
            />
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
              disabled={isLoading || !formData.name || !formData.location || !formData.description || formData.target_amount <= 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? 'Creating...' : 'Register Pura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}