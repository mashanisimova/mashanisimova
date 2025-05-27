import { RestClientV5 } from 'bybit-api';

// Initialize the Bybit API client with API keys
export const initializeBybitClient = (apiKey: string, apiSecret: string, testnet: boolean = false) => {
  console.log('Initializing Bybit client with testnet:', testnet);
  return new RestClientV5({
    key: apiKey,
    secret: apiSecret,
    testnet: testnet,
  });
};

// Get market data for a specific symbol
export const getMarketData = async (client: RestClientV5, symbol: string) => {
  try {
    console.log(`Fetching market data for ${symbol}`);
    const response = await client.getTickers({ category: 'spot', symbol });
    console.log('Market data response:', response.result);
    return response.result;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

// Get kline/candlestick data for a symbol
export const getKlineData = async (
  client: RestClientV5, 
  symbol: string, 
  interval: string = '15', // 1, 3, 5, 15, 30, 60, 120, 240, 360, 720, D, M, W
  limit: number = 200
) => {
  try {
    console.log(`Fetching kline data for ${symbol}, interval: ${interval}`);
    const response = await client.getKline({
      category: 'spot',
      symbol,
      interval,
      limit
    });
    console.log(`Received ${response.result.list?.length} klines`);
    return response.result.list;
  } catch (error) {
    console.error('Error fetching kline data:', error);
    throw error;
  }
};

// Get wallet balance
export const getWalletBalance = async (client: RestClientV5) => {
  try {
    console.log('Fetching wallet balance');
    const response = await client.getWalletBalance({ accountType: 'SPOT' });
    console.log('Wallet balance response:', response.result);
    return response.result;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

// Place a market order
export const placeMarketOrder = async (
  client: RestClientV5,
  symbol: string,
  side: 'Buy' | 'Sell',
  qty: string
) => {
  try {
    console.log(`Placing ${side} market order for ${symbol}, qty: ${qty}`);
    const response = await client.submitOrder({
      category: 'spot',
      symbol,
      side,
      orderType: 'Market',
      qty
    });
    console.log('Order response:', response);
    return response;
  } catch (error) {
    console.error('Error placing market order:', error);
    throw error;
  }
};

// Place a limit order
export const placeLimitOrder = async (
  client: RestClientV5,
  symbol: string,
  side: 'Buy' | 'Sell',
  qty: string,
  price: string
) => {
  try {
    console.log(`Placing ${side} limit order for ${symbol}, qty: ${qty}, price: ${price}`);
    const response = await client.submitOrder({
      category: 'spot',
      symbol,
      side,
      orderType: 'Limit',
      qty,
      price
    });
    console.log('Order response:', response);
    return response;
  } catch (error) {
    console.error('Error placing limit order:', error);
    throw error;
  }
};

// Place a One-Cancels-Other (OCO) order - implemented as two separate orders with client order IDs for tracking
export const placeOCOOrder = async (
  client: RestClientV5,
  symbol: string,
  side: 'Buy' | 'Sell',
  qty: string,
  limitPrice: string,
  stopPrice: string
) => {
  try {
    const baseClientOrderId = `OCO-${Date.now()}`;
    console.log(`Placing OCO ${side} order for ${symbol}`);
    
    // Create limit order
    const limitResponse = await client.submitOrder({
      category: 'spot',
      symbol,
      side,
      orderType: 'Limit',
      qty,
      price: limitPrice,
      clientOrderId: `${baseClientOrderId}-limit`
    });
    
    // Create stop order
    const stopResponse = await client.submitOrder({
      category: 'spot',
      symbol,
      side,
      orderType: 'Limit',
      qty,
      price: stopPrice,
      triggerPrice: stopPrice,
      triggerDirection: side === 'Buy' ? 1 : 2, // 1: rise, 2: fall
      triggerBy: 'LastPrice',
      clientOrderId: `${baseClientOrderId}-stop`
    });
    
    console.log('OCO orders placed:', { limitResponse, stopResponse });
    return { limitResponse, stopResponse };
  } catch (error) {
    console.error('Error placing OCO order:', error);
    throw error;
  }
};

// Place a trailing stop order
export const placeTrailingStopOrder = async (
  client: RestClientV5,
  symbol: string,
  side: 'Buy' | 'Sell',
  qty: string,
  activationPrice: string,
  trailingPercent: number
) => {
  try {
    const trailingValue = (parseFloat(activationPrice) * trailingPercent / 100).toFixed(4);
    console.log(`Placing trailing stop ${side} order for ${symbol}, activation: ${activationPrice}, trailing: ${trailingValue}`);
    
    const response = await client.submitOrder({
      category: 'spot',
      symbol,
      side,
      orderType: 'Market',
      qty,
      triggerPrice: activationPrice,
      triggerDirection: side === 'Buy' ? 1 : 2, // 1: rise, 2: fall
      triggerBy: 'LastPrice',
      trailingValue
    });
    
    console.log('Trailing stop order response:', response);
    return response;
  } catch (error) {
    console.error('Error placing trailing stop order:', error);
    throw error;
  }
};

// Get open orders
export const getOpenOrders = async (client: RestClientV5, symbol?: string) => {
  try {
    console.log('Fetching open orders');
    const response = await client.getOpenOrders({
      category: 'spot',
      symbol
    });
    console.log('Open orders response:', response.result);
    return response.result;
  } catch (error) {
    console.error('Error fetching open orders:', error);
    throw error;
  }
};

// Cancel all open orders for a symbol
export const cancelAllOrders = async (client: RestClientV5, symbol: string) => {
  try {
    console.log(`Canceling all orders for ${symbol}`);
    const response = await client.cancelAllOrders({
      category: 'spot',
      symbol
    });
    console.log('Cancel orders response:', response);
    return response;
  } catch (error) {
    console.error('Error canceling orders:', error);
    throw error;
  }
};
