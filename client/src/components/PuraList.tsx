import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Target, TrendingUp, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { CreatePuraDialog } from '@/components/CreatePuraDialog';
import { DonateDialog } from '@/components/DonateDialog';
import { PuraDetailDialog } from '@/components/PuraDetailDialog';
import type { Pura } from '../../../server/src/schema';

export function PuraList() {
  const [puras, setPuras] = useState<Pura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPura, setSelectedPura] = useState<Pura | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDonateDialog, setShowDonateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const loadPuras = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPuras.query();
      setPuras(result);
    } catch (error) {
      console.error('Failed to load puras:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPuras();
  }, [loadPuras]);

  const handlePuraCreated = useCallback((newPura: Pura) => {
    setPuras((prev: Pura[]) => [...prev, newPura]);
  }, []);

  const handleDonationCreated = useCallback(() => {
    // Reload puras to update current amounts
    loadPuras();
  }, [loadPuras]);

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
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {puras.length} Sacred Temples
          </h2>
          <p className="text-sm text-gray-600">
            Support the preservation of Balinese Hindu temples
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Pura
        </Button>
      </div>

      {/* Pura Cards */}
      {puras.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pura registered yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to register a sacred temple and start fundraising for its preservation.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register First Pura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {puras.map((pura: Pura) => {
            const progressPercentage = getProgressPercentage(pura.current_amount, pura.target_amount);
            const isCompleted = progressPercentage >= 100;

            return (
              <Card 
                key={pura.id} 
                className="hover:shadow-lg transition-shadow duration-200 border-orange-100"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg text-gray-900 line-clamp-2">
                      {pura.name}
                    </CardTitle>
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
                        Completed ✨
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600 gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{pura.location}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {pura.description}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={progressPercentage} 
                      className="h-2 bg-orange-100"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {formatCurrency(pura.current_amount)}
                      </span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Target className="h-3 w-3" />
                        <span>{formatCurrency(pura.target_amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div className="flex items-center text-xs text-gray-500 gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {pura.created_at.toLocaleDateString()}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setSelectedPura(pura);
                        setShowDetailDialog(true);
                      }}
                      className="flex-1"
                    >
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedPura(pura);
                        setShowDonateDialog(true);
                      }}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={isCompleted}
                    >
                      Donate 🙏
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreatePuraDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onPuraCreated={handlePuraCreated}
      />

      {selectedPura && (
        <>
          <DonateDialog 
            open={showDonateDialog}
            onOpenChange={setShowDonateDialog}
            pura={selectedPura}
            onDonationCreated={handleDonationCreated}
          />
          <PuraDetailDialog 
            open={showDetailDialog}
            onOpenChange={setShowDetailDialog}
            puraId={selectedPura.id}
          />
        </>
      )}
    </div>
  );
}