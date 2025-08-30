import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Target, Heart, MessageCircle, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { PuraWithDonations, Donation } from '../../../server/src/schema';

interface PuraDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puraId: number;
}

export function PuraDetailDialog({ open, onOpenChange, puraId }: PuraDetailDialogProps) {
  const [puraDetail, setPuraDetail] = useState<PuraWithDonations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPuraDetail = useCallback(async () => {
    if (!puraId) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getPuraById.query({ id: puraId });
      setPuraDetail(result);
    } catch (error) {
      console.error('Failed to load pura details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [puraId]);

  useEffect(() => {
    if (open && puraId) {
      loadPuraDetail();
    }
  }, [open, puraId, loadPuraDetail]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <div className="space-y-4 p-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!puraDetail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="text-center p-8">
            <p className="text-gray-600">Failed to load pura details.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const progressPercentage = getProgressPercentage(puraDetail.current_amount, puraDetail.target_amount);
  const isCompleted = progressPercentage >= 100;
  const totalDonations = puraDetail.donations.length;
  const averageDonation = totalDonations > 0 
    ? puraDetail.current_amount / totalDonations 
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl text-gray-900 pr-4">
                {puraDetail.name}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" />
                {puraDetail.location}
              </DialogDescription>
            </div>
            {isCompleted && (
              <Badge className="bg-green-100 text-green-800 shrink-0">
                Completed ✨
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">About This Pura</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">{puraDetail.description}</p>
              </CardContent>
            </Card>

            {/* Fundraising Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Target className="h-4 w-4" />
                  Fundraising Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="font-semibold text-lg text-gray-900">
                      {progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="text-center p-3 bg-orange-50 rounded-md">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(puraDetail.current_amount)}
                    </div>
                    <div className="text-xs text-gray-600">Raised</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-md">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(puraDetail.target_amount)}
                    </div>
                    <div className="text-xs text-gray-600">Target</div>
                  </div>
                </div>

                {totalDonations > 0 && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-blue-50 rounded-md">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold text-gray-900">{totalDonations}</span>
                      </div>
                      <div className="text-xs text-gray-600">Donors</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-md">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(averageDonation)}
                      </div>
                      <div className="text-xs text-gray-600">Avg. Donation</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Donation History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Heart className="h-4 w-4" />
                  Recent Donations ({totalDonations})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {totalDonations === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No donations yet</p>
                    <p className="text-sm">Be the first to support this sacred temple!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {puraDetail.donations
                      .sort((a: Donation, b: Donation) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((donation: Donation, index: number) => (
                        <div key={donation.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {donation.donor_name}
                                </span>
                                <span className="font-semibold text-orange-600">
                                  {formatCurrency(donation.amount)}
                                </span>
                              </div>
                              {donation.message && (
                                <div className="flex items-start gap-1 text-sm text-gray-600">
                                  <MessageCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                  <p className="italic">"{donation.message}"</p>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>{donation.created_at.toLocaleDateString()} at {donation.created_at.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                          {index < puraDetail.donations.length - 1 && (
                            <Separator className="mt-3" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Temple Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-700">Temple Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <div className="font-medium">{puraDetail.created_at.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <div className="font-medium">{puraDetail.updated_at.toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}