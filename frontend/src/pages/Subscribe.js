import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard } from 'lucide-react';

const Subscribe = () => {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [price, setPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculatePrice();
  }, [days]);

  const calculatePrice = async () => {
    try {
      const response = await api.post('/subscription/calculate', { duration_days: days });
      setPrice(response.data.amount);
    } catch (error) {
      console.error('Failed to calculate price');
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await api.post('/subscription/create', { duration_days: days });
      if (response.data.payment_url) {
        window.location.href = response.data.payment_url;
      } else {
        toast.error('Failed to create payment link');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Subscription creation failed');
    } finally {
      setLoading(false);
    }
  };

  const getDiscount = () => {
    if (days >= 180) return 15;
    if (days >= 90) return 10;
    if (days >= 30) return 5;
    return 0;
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-white">
      <nav className="border-b border-zinc-800 bg-[#18181B]">
        <div className="max-w-[1920px] mx-auto px-8 py-4 flex justify-between items-center">
          <div className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            RemoteDesk <span className="text-[#CCFF00]">Pro</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-zinc-400 hover:text-white"
            data-testid="back-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="font-['Space_Grotesk'] text-5xl font-bold mb-4">
            Choose Your <span className="text-[#CCFF00]">Duration</span>
          </h1>
          <p className="text-zinc-400 text-lg">Select how many days you need access</p>
        </div>

        <Card className="bg-[#18181B] border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white font-['Space_Grotesk'] text-2xl text-center">
              Subscription Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="text-center">
              <div className="font-['JetBrains_Mono'] text-7xl font-bold mb-2">
                {days}
                <span className="text-2xl text-zinc-400 ml-2">days</span>
              </div>
              {getDiscount() > 0 && (
                <div className="inline-block bg-[#CCFF00]/20 text-[#CCFF00] px-4 py-1 rounded-sm text-sm font-semibold">
                  {getDiscount()}% DISCOUNT APPLIED
                </div>
              )}
            </div>

            <div className="px-8">
              <Slider
                value={[days]}
                onValueChange={(value) => setDays(value[0])}
                min={1}
                max={365}
                step={1}
                className="w-full"
                data-testid="duration-slider"
              />
              <div className="flex justify-between text-sm text-zinc-500 mt-2">
                <span>1 day</span>
                <span>365 days</span>
              </div>
            </div>

            <div className="bg-[#09090B] border border-zinc-800 p-6 rounded-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-zinc-400">Base Price</span>
                <span className="font-['JetBrains_Mono'] text-zinc-400">${(days * 5).toFixed(2)}</span>
              </div>
              {getDiscount() > 0 && (
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[#CCFF00]">Volume Discount ({getDiscount()}%)</span>
                  <span className="font-['JetBrains_Mono'] text-[#CCFF00]">-${((days * 5 * getDiscount()) / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-zinc-800 pt-4 flex justify-between items-center">
                <span className="text-xl font-semibold">Total Amount</span>
                <span className="font-['JetBrains_Mono'] text-4xl font-bold text-[#CCFF00]">${price.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                <span>Up to 10 devices</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                <span>Full remote control access</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                <span>File transfer capabilities</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#CCFF00] rounded-full" />
                <span>24/7 Support</span>
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-[#CCFF00] text-black hover:bg-[#CCFF00]/90 rounded-sm py-6 text-lg uppercase tracking-widest font-semibold"
              data-testid="proceed-payment-btn"
            >
              {loading ? (
                'CREATING PAYMENT LINK...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  PROCEED TO PAYMENT
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscribe;
