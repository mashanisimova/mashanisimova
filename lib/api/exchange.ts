'use server';

import { BybitAPI } from 'bybit-api';
import { createHmac } from 'crypto';

// Define common interface for all exchanges
export interface ExchangeAPI {
  name: string;
  getKlineData: (symbol: string, interval: string, limit?: number) => Promise<any[]>;
  getOrderBook: (symbol: string, limit?: number) => Promise<any>;
  getWalletBalance: () => Promise<any>;
  placeOrder: (params: OrderParams) => Promise<any>;
  getOpenOrders: (symbol?: string) => Promise<any[]>;
  cancelOrder: (orderId: string, symbol: string) => Promise<any>;
  getFundingRate: (symbol: string) => Promise<any>;
  transferBetweenWallets?: (params: TransferParams) => Promise<any>;
}

export type OrderParams = {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit';
  qty: string | number;
  price?: string | number;
  timeInForce?: string;
  reduceOnly?: boolean;
};

export type TransferParams = {
  amount: number;
  coin: string;
  fromAccountType: string;
  toAccountType: string;
};

export type ExchangeCredentials = {
  apiKey: string;
  apiSecret: string;
  testnet?: boolean;
};

export type SupportedExchange = 'bybit' | 'binance' | 'coinbase';

// Class for Bybit Exchange
class BybitExchange implements ExchangeAPI {
  name = 'Bybit';
  private client: BybitAPI;
  private credentials: ExchangeCredentials;

  constructor(credentials: ExchangeCredentials) {
    this.credentials = credentials;
    this.client = new BybitAPI({
      key: credentials.apiKey,
      secret: credentials.apiSecret,
      testnet: credentials.testnet || false,
    });
  }

  async getKlineData(symbol: string, interval: string, limit = 200): Promise<any[]> {
    try {
      const response = await this.client.getKline({
        symbol,
        interval,
        limit: limit.toString(),
      });

      if (response && response.result && Array.isArray(response.result)) {
        return response.result;
      }
      return [];
    } catch (error) {
      console.error('Bybit getKlineData error:', error);
      return [];
    }
  }

  async getOrderBook(symbol: string, limit = 50): Promise<any> {
    try {
      const response = await this.client.getOrderBook({
        symbol,
        limit: limit.toString(),
      });

      return response?.result || { bids: [], asks: [] };
    } catch (error) {
      console.error('Bybit getOrderBook error:', error);
      return { bids: [], asks: [] };
    }
  }

  async getWalletBalance(): Promise<any> {
    try {
      const response = await this.client.getWalletBalance();
      return response?.result || null;
    } catch (error) {
      console.error('Bybit getWalletBalance error:', error);
      return null;
    }
  }

  async placeOrder(params: OrderParams): Promise<any> {
    try {
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        order_type: params.orderType,
        qty: params.qty.toString(),
        time_in_force: params.timeInForce || 'GoodTillCancel',
        reduce_only: params.reduceOnly || false,
        close_on_trigger: false,
      };

      if (params.orderType === 'Limit' && params.price) {
        orderParams.price = params.price.toString();
      }

      const response = await this.client.placeActiveOrder(orderParams);
      return response?.result || null;
    } catch (error) {
      console.error('Bybit placeOrder error:', error);
      return null;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      const params: any = {};
      if (symbol) {
        params.symbol = symbol;
      }

      const response = await this.client.getActiveOrders(params);
      return response?.result?.data || [];
    } catch (error) {
      console.error('Bybit getOpenOrders error:', error);
      return [];
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<any> {
    try {
      const response = await this.client.cancelActiveOrder({
        order_id: orderId,
        symbol,
      });
      return response?.result || null;
    } catch (error) {
      console.error('Bybit cancelOrder error:', error);
      return null;
    }
  }

  async getFundingRate(symbol: string): Promise<any> {
    try {
      const response = await this.client.getFundingRate({ symbol });
      return response?.result || null;
    } catch (error) {
      console.error('Bybit getFundingRate error:', error);
      return null;
    }
  }

  async transferBetweenWallets(params: TransferParams): Promise<any> {
    try {
      const response = await this.client.createInternalTransfer({
        amount: params.amount.toString(),
        coin: params.coin,
        from_account_type: params.fromAccountType,
        to_account_type: params.toAccountType,
      });
      return response?.result || null;
    } catch (error) {
      console.error('Bybit transferBetweenWallets error:', error);
      return null;
    }
  }
}

// Class for Binance Exchange
class BinanceExchange implements ExchangeAPI {
  name = 'Binance';
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(credentials: ExchangeCredentials) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.baseUrl = credentials.testnet
      ? 'https://testnet.binance.vision/api'
      : 'https://api.binance.com/api';
  }

  private async makeSignedRequest(endpoint: string, params: any = {}, method = 'GET'): Promise<any> {
    try {
      const timestamp = Date.now();
      const queryParams = new URLSearchParams({
        ...params,
        timestamp: timestamp.toString(),
      }).toString();

      const signature = createHmac('sha256', this.apiSecret)
        .update(queryParams)
        .digest('hex');

      const url = `${this.baseUrl}${endpoint}?${queryParams}&signature=${signature}`;

      const response = await fetch(url, {
        method,
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error(`Binance ${endpoint} error:`, error);
      throw error;
    }
  }

  private async makePublicRequest(endpoint: string, params: any = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.baseUrl}${endpoint}?${queryParams}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error(`Binance ${endpoint} error:`, error);
      throw error;
    }
  }

  async getKlineData(symbol: string, interval: string, limit = 200): Promise<any[]> {
    try {
      // Binance uses different interval format than Bybit
      const intervalMap: Record<string, string> = {
        '1': '1m',
        '3': '3m',
        '5': '5m',
        '15': '15m',
        '30': '30m',
        '60': '1h',
        '120': '2h',
        '240': '4h',
        '360': '6h',
        '720': '12h',
        'D': '1d',
        '1D': '1d',
        'W': '1w',
        '1W': '1w',
        'M': '1M',
        '1M': '1M',
      };

      const binanceInterval = intervalMap[interval] || interval;

      const response = await this.makePublicRequest('/v3/klines', {
        symbol,
        interval: binanceInterval,
        limit,
      });

      if (Array.isArray(response)) {
        // Transform Binance kline format to match Bybit format
        return response.map(candle => [
          candle[0], // Open time
          candle[1], // Open
          candle[2], // High
          candle[3], // Low
          candle[4], // Close
          candle[5], // Volume
        ]);
      }

      return [];
    } catch (error) {
      console.error('Binance getKlineData error:', error);
      return [];
    }
  }

  async getOrderBook(symbol: string, limit = 50): Promise<any> {
    try {
      const response = await this.makePublicRequest('/v3/depth', {
        symbol,
        limit,
      });

      if (response && response.bids && response.asks) {
        return {
          bids: response.bids.map((bid: string[]) => [bid[0], bid[1]]),
          asks: response.asks.map((ask: string[]) => [ask[0], ask[1]]),
        };
      }

      return { bids: [], asks: [] };
    } catch (error) {
      console.error('Binance getOrderBook error:', error);
      return { bids: [], asks: [] };
    }
  }

  async getWalletBalance(): Promise<any> {
    try {
      const response = await this.makeSignedRequest('/v3/account');

      if (response && response.balances) {
        // Transform to a format similar to Bybit's response
        const balances = response.balances.filter(
          (balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
        );

        const formattedBalances = balances.map((balance: any) => ({
          coin: balance.asset,
          free: balance.free,
          locked: balance.locked,
          total: (parseFloat(balance.free) + parseFloat(balance.locked)).toString(),
        }));

        return {
          list: formattedBalances,
          totalEquity: formattedBalances.reduce(
            (sum: number, balance: any) => sum + parseFloat(balance.total),
            0
          ),
          availableBalance: formattedBalances.reduce(
            (sum: number, balance: any) => sum + parseFloat(balance.free),
            0
          ),
        };
      }

      return null;
    } catch (error) {
      console.error('Binance getWalletBalance error:', error);
      return null;
    }
  }

  async placeOrder(params: OrderParams): Promise<any> {
    try {
      const orderParams: any = {
        symbol: params.symbol,
        side: params.side,
        type: params.orderType === 'Market' ? 'MARKET' : 'LIMIT',
        quantity: params.qty,
      };

      if (params.orderType === 'Limit' && params.price) {
        orderParams.price = params.price;
        orderParams.timeInForce = params.timeInForce || 'GTC';
      }

      const response = await this.makeSignedRequest('/v3/order', orderParams, 'POST');

      if (response && response.orderId) {
        return {
          orderId: response.orderId,
          symbol: response.symbol,
          price: response.price,
          qty: response.origQty,
          side: response.side,
          orderType: response.type,
        };
      }

      return null;
    } catch (error) {
      console.error('Binance placeOrder error:', error);
      return null;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      const params: any = {};
      if (symbol) {
        params.symbol = symbol;
      }

      const response = await this.makeSignedRequest('/v3/openOrders', params);

      if (Array.isArray(response)) {
        return response.map(order => ({
          orderId: order.orderId,
          symbol: order.symbol,
          price: order.price,
          qty: order.origQty,
          side: order.side,
          orderType: order.type,
          status: order.status,
        }));
      }

      return [];
    } catch (error) {
      console.error('Binance getOpenOrders error:', error);
      return [];
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<any> {
    try {
      const response = await this.makeSignedRequest(
        '/v3/order',
        {
          symbol,
          orderId,
        },
        'DELETE'
      );

      if (response && response.orderId) {
        return {
          orderId: response.orderId,
          symbol: response.symbol,
          status: 'CANCELED',
        };
      }

      return null;
    } catch (error) {
      console.error('Binance cancelOrder error:', error);
      return null;
    }
  }

  async getFundingRate(symbol: string): Promise<any> {
    try {
      // For futures only, not available in spot trading
      const response = await this.makePublicRequest('/fapi/v1/premiumIndex', {
        symbol,
      });

      if (response && response.lastFundingRate) {
        return {
          symbol: response.symbol,
          fundingRate: response.lastFundingRate,
          nextFundingTime: response.nextFundingTime,
        };
      }

      return null;
    } catch (error) {
      console.error('Binance getFundingRate error:', error);
      return null;
    }
  }
}

// Class for Coinbase Pro Exchange
class CoinbaseExchange implements ExchangeAPI {
  name = 'Coinbase';
  private baseUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private passphrase: string;

  constructor(credentials: ExchangeCredentials & { passphrase: string }) {
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
    this.passphrase = credentials.passphrase;
    this.baseUrl = 'https://api.exchange.coinbase.com';
  }

  private async makeSignedRequest(method: string, endpoint: string, body?: any): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const requestPath = endpoint;
      const bodyStr = body ? JSON.stringify(body) : '';

      // Create the message to sign
      const message = timestamp + method + requestPath + bodyStr;
      const signature = createHmac('sha256', Buffer.from(this.apiSecret, 'base64'))
        .update(message)
        .digest('base64');

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'CB-ACCESS-KEY': this.apiKey,
          'CB-ACCESS-SIGN': signature,
          'CB-ACCESS-TIMESTAMP': timestamp.toString(),
          'CB-ACCESS-PASSPHRASE': this.passphrase,
          'Content-Type': 'application/json',
        },
        body: bodyStr.length > 0 ? bodyStr : undefined,
      });

      return await response.json();
    } catch (error) {
      console.error(`Coinbase ${endpoint} error:`, error);
      throw error;
    }
  }

  private async makePublicRequest(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error(`Coinbase ${endpoint} error:`, error);
      throw error;
    }
  }

  // Coinbase Pro doesn't have standard kline data, so we need to use candles endpoint
  async getKlineData(symbol: string, interval: string, limit = 200): Promise<any[]> {
    try {
      // Convert symbol format from BTCUSDT to BTC-USD
      const formattedSymbol = symbol
        .replace(/USDT$/, '-USD')
        .replace(/BTC$/, '-BTC')
        .replace(/ETH$/, '-ETH');

      // Convert interval format
      const intervalMap: Record<string, number> = {
        '1': 60,
        '5': 300,
        '15': 900,
        '60': 3600,
        '240': 14400,
        'D': 86400,
        '1D': 86400,
      };

      const granularity = intervalMap[interval] || 300; // Default to 5min

      // Calculate start and end time based on limit and granularity
      const end = new Date();
      const start = new Date(end.getTime() - granularity * 1000 * limit);

      const endpoint = `/products/${formattedSymbol}/candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`;

      const response = await this.makePublicRequest(endpoint);

      if (Array.isArray(response)) {
        // Transform Coinbase candle format to match Bybit format
        return response.map(candle => [
          candle[0] * 1000, // Timestamp (convert seconds to ms)
          candle[3].toString(), // Open
          candle[2].toString(), // High
          candle[1].toString(), // Low
          candle[4].toString(), // Close
          candle[5].toString(), // Volume
        ]);
      }

      return [];
    } catch (error) {
      console.error('Coinbase getKlineData error:', error);
      return [];
    }
  }

  async getOrderBook(symbol: string, limit = 50): Promise<any> {
    try {
      // Convert symbol format
      const formattedSymbol = symbol
        .replace(/USDT$/, '-USD')
        .replace(/BTC$/, '-BTC')
        .replace(/ETH$/, '-ETH');

      // Coinbase uses level parameter instead of limit
      const level = limit <= 50 ? 2 : 3; // Level 2 for <= 50, Level 3 for more

      const response = await this.makePublicRequest(`/products/${formattedSymbol}/book?level=${level}`);

      if (response && response.bids && response.asks) {
        return {
          bids: response.bids.slice(0, limit).map((bid: string[]) => [bid[0], bid[1]]),
          asks: response.asks.slice(0, limit).map((ask: string[]) => [ask[0], ask[1]]),
        };
      }

      return { bids: [], asks: [] };
    } catch (error) {
      console.error('Coinbase getOrderBook error:', error);
      return { bids: [], asks: [] };
    }
  }

  async getWalletBalance(): Promise<any> {
    try {
      const response = await this.makeSignedRequest('GET', '/accounts');

      if (Array.isArray(response)) {
        // Transform to a format similar to Bybit's response
        const balances = response.filter(
          account => parseFloat(account.balance) > 0
        );

        const formattedBalances = balances.map(account => ({
          coin: account.currency,
          free: account.available,
          locked: (parseFloat(account.balance) - parseFloat(account.available)).toString(),
          total: account.balance,
        }));

        return {
          list: formattedBalances,
          totalEquity: formattedBalances.reduce(
            (sum, balance) => sum + parseFloat(balance.total),
            0
          ),
          availableBalance: formattedBalances.reduce(
            (sum, balance) => sum + parseFloat(balance.free),
            0
          ),
        };
      }

      return null;
    } catch (error) {
      console.error('Coinbase getWalletBalance error:', error);
      return null;
    }
  }

  async placeOrder(params: OrderParams): Promise<any> {
    try {
      // Convert symbol format
      const formattedSymbol = params.symbol
        .replace(/USDT$/, '-USD')
        .replace(/BTC$/, '-BTC')
        .replace(/ETH$/, '-ETH');

      const orderParams: any = {
        product_id: formattedSymbol,
        side: params.side.toLowerCase(),
        size: params.qty.toString(),
        type: params.orderType.toLowerCase(),
      };

      if (params.orderType === 'Limit' && params.price) {
        orderParams.price = params.price.toString();
        orderParams.time_in_force = params.timeInForce?.toLowerCase() || 'gtc';
      }

      const response = await this.makeSignedRequest('POST', '/orders', orderParams);

      if (response && response.id) {
        return {
          orderId: response.id,
          symbol: params.symbol,
          price: response.price || 'market',
          qty: response.size,
          side: response.side.toUpperCase(),
          orderType: response.type.toUpperCase(),
        };
      }

      return null;
    } catch (error) {
      console.error('Coinbase placeOrder error:', error);
      return null;
    }
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    try {
      let endpoint = '/orders?status=open';
      if (symbol) {
        // Convert symbol format
        const formattedSymbol = symbol
          .replace(/USDT$/, '-USD')
          .replace(/BTC$/, '-BTC')
          .replace(/ETH$/, '-ETH');
        endpoint += `&product_id=${formattedSymbol}`;
      }

      const response = await this.makeSignedRequest('GET', endpoint);

      if (Array.isArray(response)) {
        return response.map(order => ({
          orderId: order.id,
          symbol: order.product_id.replace('-USD', 'USDT').replace('-BTC', 'BTC').replace('-ETH', 'ETH'),
          price: order.price || 'market',
          qty: order.size,
          side: order.side.toUpperCase(),
          orderType: order.type.toUpperCase(),
          status: order.status.toUpperCase(),
        }));
      }

      return [];
    } catch (error) {
      console.error('Coinbase getOpenOrders error:', error);
      return [];
    }
  }

  async cancelOrder(orderId: string, symbol: string): Promise<any> {
    try {
      const response = await this.makeSignedRequest('DELETE', `/orders/${orderId}`);

      // Coinbase Pro returns the orderId as a string on successful cancellation
      if (response === orderId) {
        return {
          orderId,
          symbol,
          status: 'CANCELED',
        };
      }

      return null;
    } catch (error) {
      console.error('Coinbase cancelOrder error:', error);
      return null;
    }
  }

  // Coinbase Pro doesn't have funding rates as it's primarily a spot exchange
  async getFundingRate(symbol: string): Promise<any> {
    return null;
  }
}

// Exchange factory function
export function createExchange(exchangeType: SupportedExchange, credentials: any): ExchangeAPI {
  switch (exchangeType) {
    case 'bybit':
      return new BybitExchange(credentials);
    case 'binance':
      return new BinanceExchange(credentials);
    case 'coinbase':
      return new CoinbaseExchange(credentials);
    default:
      throw new Error(`Unsupported exchange: ${exchangeType}`);
  }
}

// Export a single instance for direct use
let bybitExchange: BybitExchange | null = null;

// Setup function to initialize the default exchange
export function setupBybitExchange(credentials: ExchangeCredentials) {
  bybitExchange = new BybitExchange(credentials);
  return bybitExchange;
}

// Direct exports for backward compatibility
export async function getKlineData(symbol: string, interval: string, limit = 200) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.getKlineData(symbol, interval, limit);
}

export async function getOrderBook(symbol: string, limit = 50) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.getOrderBook(symbol, limit);
}

export async function getWalletBalance() {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.getWalletBalance();
}

export async function placeOrder(params: OrderParams) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.placeOrder(params);
}

export async function getOpenOrders(symbol?: string) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.getOpenOrders(symbol);
}

export async function cancelOrder(orderId: string, symbol: string) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.cancelOrder(orderId, symbol);
}

export async function getFundingRate(symbol: string) {
  if (!bybitExchange) {
    throw new Error('Exchange not initialized. Call setupBybitExchange first.');
  }
  return bybitExchange.getFundingRate(symbol);
}
