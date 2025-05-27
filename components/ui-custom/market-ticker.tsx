'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { useMarketData } from '@/lib/hooks/useMarketData';

type TickerData = {
  symbol: string;
  lastPrice: string;
  priceChange24h: string;
  volume24h: string;
  high24h: string;
  low24h: string;
};

export function MarketTicker({ symbol }: { symbol: string }) {
  const { bybitClient, isAuthenticated } = useBybitAuth();
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const { data, isLoading } = useMarketData(symbol);
  
  useEffect(() => {
    if (data && data.list && data.list.length > 0) {
      const ticker = data.list[0];
      setTickerData({
        symbol: ticker.symbol,
        lastPrice: ticker.lastPrice,
        priceChange24h: ticker.price24hPcnt,
        volume24h: ticker.volume24h,
        high24h: ticker.highPrice24h,
        low24h: ticker.lowPrice24h
      });
    }
  }, [data]);
  
  const getPriceChangeClass = (change: string) => {
    const changeNum = parseFloat(change);
    if (changeNum > 0) return 'text-bybit-green';
    if (changeNum < 0) return 'text-bybit-red';
    return 'text-bybit-text';
  };
  
  const formatNumber = (numStr: string, precision: number = 2) => {
    const num = parseFloat(numStr);
    return num.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
  };
  
  const formatLargeNumber = (numStr: string) => {
    const num = parseFloat(numStr);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };
  
  return (
    <Card className="bg-gradient-to-br from-bybit-dark to-bybit-darker border-bybit-darker">
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-bybit-yellow"></div>
          </div>
        ) : tickerData ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="text-lg font-medium">${formatNumber(tickerData.lastPrice)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h Change</div>
              <div className={`text-lg font-medium ${getPriceChangeClass(tickerData.priceChange24h)}`}>
                {parseFloat(tickerData.priceChange24h) > 0 ? '+' : ''}
                {(parseFloat(tickerData.priceChange24h) * 100).toFixed(2)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h High</div>
              <div className="text-sm">${formatNumber(tickerData.high24h)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">24h Low</div>
              <div className="text-sm">${formatNumber(tickerData.low24h)}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground">24h Volume</div>
              <div className="text-sm">{formatLargeNumber(tickerData.volume24h)}</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">Connect to view market data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
