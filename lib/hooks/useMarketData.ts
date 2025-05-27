import { useState, useEffect } from 'react';
import { RestClientV5 } from 'bybit-api';
import { getMarketData, getKlineData } from '@/lib/api/bybit';
import { toast } from 'sonner';

interface MarketData {
  symbol: string;
  lastPrice: string;
  volume24h: string;
  highPrice24h: string;
  lowPrice24h: string;
  prevPrice24h: string;
  price24hPcnt: string;
}

export const useMarketData = (client: RestClientV5 | null, symbol: string) => {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !symbol) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getMarketData(client, symbol);
        if (isMounted && result.list && result.list.length > 0) {
          setData(result.list[0] as MarketData);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching market data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch market data');
          toast.error('Error', {
            description: `Failed to fetch market data: ${err.message}`
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling every 5 seconds
    const intervalId = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [client, symbol]);

  return { data, loading, error };
};

export interface KlineData {
  timestamp: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
}

export const useKlineData = (
  client: RestClientV5 | null, 
  symbol: string, 
  interval: string = '15'
) => {
  const [data, setData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !symbol) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getKlineData(client, symbol, interval);
        if (isMounted && result) {
          // Bybit returns most recent data first, we need to reverse it for charts
          const formattedData = result.map((item: string[]) => ({
            timestamp: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
            turnover: item[6]
          })).reverse();
          
          setData(formattedData);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching kline data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch kline data');
          toast.error('Error', {
            description: `Failed to fetch kline data: ${err.message}`
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling based on interval
    // For 1m, poll every 30s; for others, poll less frequently
    const pollInterval = interval === '1' ? 30000 : 60000;
    const intervalId = setInterval(fetchData, pollInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [client, symbol, interval]);

  return { data, loading, error };
};
