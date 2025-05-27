'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { useToast } from '@/components/ui/use-toast';
import { placeLimitOrder, placeMarketOrder, placeOCOOrder, placeTrailingStopOrder } from '@/lib/api/bybit';
import { ArrowUpCircle, ArrowDownCircle, Target, TrendingUp } from 'lucide-react';

export function OrderForm({ symbol }: { symbol: string }) {
  const { bybitClient, isAuthenticated } = useBybitAuth();
  const { toast } = useToast();
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [activationPrice, setActivationPrice] = useState('');
  const [trailingPercent, setTrailingPercent] = useState('1.0');
  const [useTrailing, setUseTrailing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gradient background class for consistent UI
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border-bybit-darker`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bybitClient || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      let response;

      if (orderType === 'market') {
        response = await placeMarketOrder(bybitClient, symbol, side, quantity);
      } else if (orderType === 'limit') {
        response = await placeLimitOrder(bybitClient, symbol, side, quantity, price);
      } else if (orderType === 'oco') {
        response = await placeOCOOrder(bybitClient, symbol, side, quantity, price, stopPrice);
      } else if (orderType === 'trailing') {
        response = await placeTrailingStopOrder(
          bybitClient, 
          symbol, 
          side, 
          quantity, 
          activationPrice, 
          parseFloat(trailingPercent)
        );
      }

      toast({
        title: 'Order Submitted',
        description: `${side} ${orderType} order for ${symbol} has been submitted`,
        variant: 'default',
      });

      // Clear form
      setQuantity('');
      setPrice('');
      setStopPrice('');
      setActivationPrice('');
    } catch (error: any) {
      console.error('Order submission error:', error);
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className={gradientBg}>
        <CardHeader>
          <CardTitle className="text-bybit-text">Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-bybit-text">Connect your Bybit account to trade</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={gradientBg}>
      <CardHeader>
        <CardTitle className="text-bybit-text">Place Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market" value={orderType} onValueChange={setOrderType}>
          <TabsList className="w-full bg-bybit-darker mb-4">
            <TabsTrigger value="market" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
              Market
            </TabsTrigger>
            <TabsTrigger value="limit" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
              Limit
            </TabsTrigger>
            <TabsTrigger value="oco" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
              OCO
            </TabsTrigger>
            <TabsTrigger value="trailing" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
              Trailing
            </TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Button 
                type="button" 
                onClick={() => setSide('Buy')} 
                className={`h-14 ${side === 'Buy' ? 'bg-bybit-green hover:bg-bybit-green/90 text-white' : 'bg-bybit-darker text-bybit-green'}`}
              >
                <ArrowUpCircle className="mr-2 h-5 w-5" />
                Buy / Long
              </Button>
              <Button 
                type="button" 
                onClick={() => setSide('Sell')} 
                className={`h-14 ${side === 'Sell' ? 'bg-bybit-red hover:bg-bybit-red/90 text-white' : 'bg-bybit-darker text-bybit-red'}`}
              >
                <ArrowDownCircle className="mr-2 h-5 w-5" />
                Sell / Short
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-bybit-darker text-bybit-text"
                placeholder="0.00"
                required
              />
            </div>
            
            {(orderType === 'limit' || orderType === 'oco') && (
              <div className="space-y-2">
                <Label>Limit Price</Label>
                <Input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-bybit-darker text-bybit-text"
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            
            {orderType === 'oco' && (
              <div className="space-y-2">
                <Label>Stop Price</Label>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-bybit-yellow" />
                  <Input
                    type="text"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(e.target.value)}
                    className="bg-bybit-darker text-bybit-text"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            )}
            
            {orderType === 'trailing' && (
              <>
                <div className="space-y-2">
                  <Label>Activation Price</Label>
                  <Input
                    type="text"
                    value={activationPrice}
                    onChange={(e) => setActivationPrice(e.target.value)}
                    className="bg-bybit-darker text-bybit-text"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trailing Percentage</Label>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-bybit-yellow" />
                    <Input
                      type="text"
                      value={trailingPercent}
                      onChange={(e) => setTrailingPercent(e.target.value)}
                      className="bg-bybit-darker text-bybit-text"
                      placeholder="1.0"
                      required
                    />
                    <span>%</span>
                  </div>
                </div>
              </>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/90 mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : `${side} ${symbol}`}
            </Button>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}
