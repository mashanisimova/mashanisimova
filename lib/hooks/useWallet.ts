import { useState, useEffect } from 'react';
import { RestClientV5 } from 'bybit-api';
import { getWalletBalance, getOpenOrders } from '@/lib/api/bybit';
import { toast } from 'sonner';

interface WalletBalance {
  coin: string;
  free: string; // Available balance
  locked: string; // In order
  total: string; // Total equity
}

export const useWalletBalance = (client: RestClientV5 | null) => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getWalletBalance(client);
        
        if (isMounted && result && result.list && result.list.length > 0) {
          // Extract all coin balances from the first account (SPOT)
          const accountBalances = result.list[0].coin || [];
          
          // Filter to only show coins with non-zero total balance
          const nonZeroBalances = accountBalances
            .filter((balance: any) => parseFloat(balance.walletBalance) > 0)
            .map((balance: any) => ({
              coin: balance.coin,
              free: balance.free,
              locked: balance.locked,
              total: balance.walletBalance
            }));
          
          setBalances(nonZeroBalances);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching wallet balance:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch wallet balance');
          toast.error('Error', {
            description: `Failed to fetch wallet balance: ${err.message}`
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [client]);

  return { balances, loading, error };
};

interface OpenOrder {
  orderId: string;
  symbol: string;
  price: string;
  qty: string;
  side: 'Buy' | 'Sell';
  orderType: string;
  orderStatus: string;
  createTime: string;
}

export const useOpenOrders = (client: RestClientV5 | null, symbol?: string) => {
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getOpenOrders(client, symbol);
        
        if (isMounted && result && result.list) {
          setOrders(result.list as OpenOrder[]);
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching open orders:', err);
        if (isMounted) {
          setError(err.message || 'Failed to fetch open orders');
          toast.error('Error', {
            description: `Failed to fetch open orders: ${err.message}`
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling every 10 seconds
    const intervalId = setInterval(fetchData, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [client, symbol]);

  return { orders, loading, error };
};
