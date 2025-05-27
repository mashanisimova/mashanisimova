/**
 * Real-Time Data Streaming Module
 * 
 * This module provides real-time market data streaming capabilities including
 * order book analysis, trade flow visualization, and high-frequency updates
 * for immediate trade execution based on real-time market conditions.
 */

export interface OrderBookSnapshot {
  symbol: string;
  timestamp: number;
  bids: [number, number][]; // [price, quantity]
  asks: [number, number][]; // [price, quantity]
  spread: number;
  bidWallsAt: number[];
  askWallsAt: number[];
  liquidityImbalance: number; // -100 to 100, negative = more selling pressure
}

export interface TradeFlowData {
  symbol: string;
  timestamp: number;
  timeframe: '1m' | '5m' | '15m' | '1h';
  trades: {
    price: number;
    quantity: number;
    side: 'buy' | 'sell';
    liquidation: boolean;
    timestamp: number;
  }[];
  buyVolume: number;
  sellVolume: number;
  buyCount: number;
  sellCount: number;
  largeOrdersThreshold: number;
  largeOrders: {
    price: number;
    quantity: number;
    side: 'buy' | 'sell';
    timestamp: number;
    marketImpact: number; // 0-100 scale
  }[];
  volumeProfile: {
    price: number;
    volume: number;
    side: 'buy' | 'sell';
  }[];
}

export interface RealTimeMarketUpdate {
  symbol: string;
  timestamp: number;
  lastPrice: number;
  priceChange1m: number; // Percentage
  volumeChange1m: number; // Percentage
  orderBookUpdate: OrderBookSnapshot;
  tradeFlow: TradeFlowData;
  liquidationsInProgress: boolean;
  volatilitySpike: boolean;
  immediateTrend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
  momentumStrength: number; // 0-100
  anomalyDetected: boolean;
  anomalyType?: 'price_spike' | 'volume_spike' | 'liquidity_withdrawal' | 'cascading_liquidations';
}

/**
 * Subscribes to real-time order book data for a symbol
 * @param symbol The trading pair to monitor
 * @param depth Depth of the order book to track
 * @returns Real-time order book snapshots
 */
export async function subscribeToOrderBook(
  symbol: string,
  depth: number = 20
): Promise<OrderBookSnapshot> {
  console.log(`Subscribing to order book for ${symbol} with depth ${depth}`);
  
  // In a real implementation, this would connect to exchange WebSocket APIs
  // to receive real-time order book updates
  
  // Simulated order book data for the trading bot
  const simulatedOrderBook = generateOrderBookData(symbol, depth);
  
  return simulatedOrderBook;
}

/**
 * Subscribes to real-time trade flow for a symbol
 * @param symbol The trading pair to monitor
 * @param timeframe Timeframe for aggregation
 * @returns Real-time trade flow data
 */
export async function subscribeToTradeFlow(
  symbol: string,
  timeframe: '1m' | '5m' | '15m' | '1h' = '1m'
): Promise<TradeFlowData> {
  console.log(`Subscribing to trade flow for ${symbol} with timeframe ${timeframe}`);
  
  // In a real implementation, this would connect to exchange WebSocket APIs
  // to receive real-time trade data
  
  // Simulated trade flow data for the trading bot
  const simulatedTradeFlow = generateTradeFlowData(symbol, timeframe);
  
  return simulatedTradeFlow;
}

/**
 * Subscribes to comprehensive real-time market updates
 * @param symbol The trading pair to monitor
 * @returns Real-time market updates with integrated data
 */
export async function subscribeToMarketUpdates(symbol: string): Promise<RealTimeMarketUpdate> {
  console.log(`Subscribing to comprehensive market updates for ${symbol}`);
  
  // In a real implementation, this would aggregate multiple data sources
  // from exchange WebSocket APIs to provide a unified market view
  
  // Get order book and trade flow data
  const orderBookData = await subscribeToOrderBook(symbol);
  const tradeFlowData = await subscribeToTradeFlow(symbol);
  
  // Calculate derived metrics
  const lastPrice = calculateLastPrice(tradeFlowData);
  const priceChange1m = calculatePriceChange(tradeFlowData);
  const volumeChange1m = calculateVolumeChange(tradeFlowData);
  const liquidationsInProgress = detectLiquidations(tradeFlowData);
  const volatilitySpike = detectVolatilitySpike(tradeFlowData, priceChange1m);
  const immediateTrend = determineImmediateTrend(tradeFlowData, orderBookData);
  const momentumStrength = calculateMomentumStrength(tradeFlowData, orderBookData, immediateTrend);
  const { anomalyDetected, anomalyType } = detectAnomalies(tradeFlowData, orderBookData, priceChange1m);
  
  return {
    symbol,
    timestamp: Date.now(),
    lastPrice,
    priceChange1m,
    volumeChange1m,
    orderBookUpdate: orderBookData,
    tradeFlow: tradeFlowData,
    liquidationsInProgress,
    volatilitySpike,
    immediateTrend,
    momentumStrength,
    anomalyDetected,
    anomalyType
  };
}

/**
 * Get real-time data signal for trading decisions
 * @param symbol The trading pair to analyze
 * @returns Signal for immediate trading decisions
 */
export async function getRealTimeDataSignal(symbol: string): Promise<{
  signal: number; // -100 to 100
  confidence: number; // 0-100
  immediateAction?: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  signalTimeframe: 'seconds' | 'minutes' | 'hour';
  anomalyAlert?: {
    type: string;
    severity: number; // 0-100
    recommendedAction: string;
  };
  volumeProfile: {
    buyPressure: number; // 0-100
    sellPressure: number; // 0-100
    largeOrderImpact: number; // -100 to 100
  };
}> {
  try {
    const marketUpdate = await subscribeToMarketUpdates(symbol);
    
    // Calculate the trading signal based on real-time data
    const signalData = calculateRealTimeSignal(marketUpdate);
    
    // Calculate volume profile metrics
    const volumeProfile = analyzeVolumeProfile(marketUpdate);
    
    // Create anomaly alert if detected
    let anomalyAlert = undefined;
    if (marketUpdate.anomalyDetected && marketUpdate.anomalyType) {
      anomalyAlert = createAnomalyAlert(marketUpdate.anomalyType, marketUpdate);
    }
    
    return {
      signal: signalData.signal,
      confidence: signalData.confidence,
      immediateAction: signalData.action,
      signalTimeframe: 'minutes',
      anomalyAlert,
      volumeProfile
    };
  } catch (error) {
    console.error('Error in real-time data signal generation:', error);
    return {
      signal: 0,
      confidence: 0,
      signalTimeframe: 'minutes',
      volumeProfile: {
        buyPressure: 0,
        sellPressure: 0,
        largeOrderImpact: 0
      }
    };
  }
}

/* Helper functions */

/**
 * Generates simulated order book data for testing
 */
function generateOrderBookData(symbol: string, depth: number): OrderBookSnapshot {
  // Base price for different symbols
  let basePrice: number;
  switch (symbol) {
    case 'BTCUSDT':
      basePrice = 61250 + (Math.random() * 200 - 100);
      break;
    case 'ETHUSDT':
      basePrice = 3510 + (Math.random() * 20 - 10);
      break;
    case 'SOLUSDT':
      basePrice = 150 + (Math.random() * 5 - 2.5);
      break;
    default:
      basePrice = 100 + (Math.random() * 10 - 5);
  }
  
  // Generate bids (buy orders) - slightly below current price
  const bids: [number, number][] = [];
  for (let i = 0; i < depth; i++) {
    // Price decreases as we go down the order book
    const priceStep = Math.random() * 2 + 0.5; // Random step between 0.5 and 2.5
    const price = basePrice - (i * priceStep);
    
    // Quantity tends to be higher at psychological levels
    let quantity = Math.random() * 5 + 0.1; // Base quantity
    
    // Occasional large orders (walls)
    if (Math.random() < 0.15) {
      quantity = quantity * (10 + Math.random() * 20);
    }
    
    bids.push([price, quantity]);
  }
  
  // Generate asks (sell orders) - slightly above current price
  const asks: [number, number][] = [];
  for (let i = 0; i < depth; i++) {
    // Price increases as we go up the order book
    const priceStep = Math.random() * 2 + 0.5; // Random step between 0.5 and 2.5
    const price = basePrice + (i * priceStep);
    
    // Quantity tends to be higher at psychological levels
    let quantity = Math.random() * 5 + 0.1; // Base quantity
    
    // Occasional large orders (walls)
    if (Math.random() < 0.15) {
      quantity = quantity * (10 + Math.random() * 20);
    }
    
    asks.push([price, quantity]);
  }
  
  // Sort bids in descending order (highest bid first)
  bids.sort((a, b) => b[0] - a[0]);
  
  // Sort asks in ascending order (lowest ask first)
  asks.sort((a, b) => a[0] - b[0]);
  
  // Calculate spread
  const spread = asks[0][0] - bids[0][0];
  
  // Identify walls (large orders)
  const bidWallsAt = bids
    .filter(([_, quantity]) => quantity > 10)
    .map(([price, _]) => price);
  
  const askWallsAt = asks
    .filter(([_, quantity]) => quantity > 10)
    .map(([price, _]) => price);
  
  // Calculate liquidity imbalance
  const totalBidVolume = bids.reduce((sum, [_, quantity]) => sum + quantity, 0);
  const totalAskVolume = asks.reduce((sum, [_, quantity]) => sum + quantity, 0);
  
  // Normalize to -100 to 100 range
  const liquidityImbalance = ((totalBidVolume - totalAskVolume) / (totalBidVolume + totalAskVolume)) * 100;
  
  return {
    symbol,
    timestamp: Date.now(),
    bids,
    asks,
    spread,
    bidWallsAt,
    askWallsAt,
    liquidityImbalance
  };
}

/**
 * Generates simulated trade flow data for testing
 */
function generateTradeFlowData(symbol: string, timeframe: '1m' | '5m' | '15m' | '1h'): TradeFlowData {
  // Base price for different symbols
  let basePrice: number;
  switch (symbol) {
    case 'BTCUSDT':
      basePrice = 61250 + (Math.random() * 200 - 100);
      break;
    case 'ETHUSDT':
      basePrice = 3510 + (Math.random() * 20 - 10);
      break;
    case 'SOLUSDT':
      basePrice = 150 + (Math.random() * 5 - 2.5);
      break;
    default:
      basePrice = 100 + (Math.random() * 10 - 5);
  }
  
  // Determine number of trades based on timeframe
  let tradeCount: number;
  switch (timeframe) {
    case '1m':
      tradeCount = 20 + Math.floor(Math.random() * 30);
      break;
    case '5m':
      tradeCount = 80 + Math.floor(Math.random() * 120);
      break;
    case '15m':
      tradeCount = 200 + Math.floor(Math.random() * 300);
      break;
    case '1h':
      tradeCount = 800 + Math.floor(Math.random() * 1200);
      break;
  }
  
  // Generate trades
  const trades = [];
  let currentPrice = basePrice;
  const now = Date.now();
  
  // Bias towards buys or sells (slightly)
  const buyBias = Math.random() > 0.5 ? 0.55 : 0.45;
  
  let buyVolume = 0;
  let sellVolume = 0;
  let buyCount = 0;
  let sellCount = 0;
  
  // Threshold for large orders
  const largeOrdersThreshold = symbol === 'BTCUSDT' ? 0.5 : 
    symbol === 'ETHUSDT' ? 5 : 
    symbol === 'SOLUSDT' ? 50 : 10;
  
  // Large orders tracking
  const largeOrders = [];
  
  // Volume profile tracking
  const volumeByPrice: Record<number, { buy: number; sell: number }> = {};
  
  for (let i = 0; i < tradeCount; i++) {
    // Determine timestamp (distributed through the timeframe)
    const timeframeMs = timeframeToMs(timeframe);
    const timestamp = now - (Math.random() * timeframeMs);
    
    // Simulate price movements
    const priceChange = (Math.random() * 0.2 - 0.1) * (symbol === 'BTCUSDT' ? 10 : 1);
    currentPrice += priceChange;
    
    // Determine trade side
    const isBuy = Math.random() < buyBias;
    
    // Determine quantity (occasional large orders)
    let quantity = Math.random() * (symbol === 'BTCUSDT' ? 0.5 : 
      symbol === 'ETHUSDT' ? 5 : 
      symbol === 'SOLUSDT' ? 50 : 10);
    
    // Occasional large orders
    const isLargeOrder = Math.random() < 0.1;
    if (isLargeOrder) {
      quantity *= 5 + Math.random() * 10;
    }
    
    // Occasional liquidations (rare)
    const isLiquidation = Math.random() < 0.02;
    
    // Create trade
    const trade = {
      price: currentPrice,
      quantity,
      side: isBuy ? 'buy' as const : 'sell' as const,
      liquidation: isLiquidation,
      timestamp
    };
    
    trades.push(trade);
    
    // Update volume counters
    if (isBuy) {
      buyVolume += quantity;
      buyCount++;
    } else {
      sellVolume += quantity;
      sellCount++;
    }
    
    // Track volume by price
    const priceBucket = Math.round(currentPrice * 100) / 100; // Round to 2 decimal places
    if (!volumeByPrice[priceBucket]) {
      volumeByPrice[priceBucket] = { buy: 0, sell: 0 };
    }
    if (isBuy) {
      volumeByPrice[priceBucket].buy += quantity;
    } else {
      volumeByPrice[priceBucket].sell += quantity;
    }
    
    // Track large orders
    if (quantity > largeOrdersThreshold) {
      // Calculate market impact
      const relativeSize = quantity / largeOrdersThreshold;
      const marketImpact = Math.min(100, relativeSize * 20);
      
      largeOrders.push({
        price: currentPrice,
        quantity,
        side: isBuy ? 'buy' as const : 'sell' as const,
        timestamp,
        marketImpact
      });
    }
  }
  
  // Sort trades by timestamp
  trades.sort((a, b) => a.timestamp - b.timestamp);
  
  // Create volume profile
  const volumeProfile = Object.entries(volumeByPrice).map(([price, volumes]) => {
    const totalVolume = volumes.buy + volumes.sell;
    return {
      price: parseFloat(price),
      volume: totalVolume,
      side: volumes.buy > volumes.sell ? 'buy' as const : 'sell' as const
    };
  });
  
  return {
    symbol,
    timestamp: now,
    timeframe,
    trades,
    buyVolume,
    sellVolume,
    buyCount,
    sellCount,
    largeOrdersThreshold,
    largeOrders,
    volumeProfile
  };
}

/**
 * Converts timeframe string to milliseconds
 */
function timeframeToMs(timeframe: '1m' | '5m' | '15m' | '1h'): number {
  switch (timeframe) {
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
  }
}

/**
 * Calculates the last price from trade flow data
 */
function calculateLastPrice(tradeFlow: TradeFlowData): number {
  if (tradeFlow.trades.length === 0) return 0;
  
  // Sort by timestamp and get the most recent trade
  const sortedTrades = [...tradeFlow.trades].sort((a, b) => b.timestamp - a.timestamp);
  return sortedTrades[0].price;
}

/**
 * Calculates the price change in the last minute
 */
function calculatePriceChange(tradeFlow: TradeFlowData): number {
  if (tradeFlow.trades.length < 2) return 0;
  
  // Sort trades by timestamp
  const sortedTrades = [...tradeFlow.trades].sort((a, b) => a.timestamp - b.timestamp);
  
  // Get first and last price
  const firstPrice = sortedTrades[0].price;
  const lastPrice = sortedTrades[sortedTrades.length - 1].price;
  
  // Calculate percentage change
  return ((lastPrice - firstPrice) / firstPrice) * 100;
}

/**
 * Calculates the volume change in the last minute
 */
function calculateVolumeChange(tradeFlow: TradeFlowData): number {
  if (tradeFlow.trades.length < 10) return 0;
  
  // Sort trades by timestamp
  const sortedTrades = [...tradeFlow.trades].sort((a, b) => a.timestamp - b.timestamp);
  
  // Split into two halves
  const midpoint = Math.floor(sortedTrades.length / 2);
  const firstHalf = sortedTrades.slice(0, midpoint);
  const secondHalf = sortedTrades.slice(midpoint);
  
  // Calculate volume in each half
  const firstHalfVolume = firstHalf.reduce((sum, trade) => sum + trade.quantity, 0);
  const secondHalfVolume = secondHalf.reduce((sum, trade) => sum + trade.quantity, 0);
  
  // Calculate percentage change
  return firstHalfVolume > 0 ? 
    ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100 : 0;
}

/**
 * Detects if liquidations are in progress
 */
function detectLiquidations(tradeFlow: TradeFlowData): boolean {
  // Check if any trades are liquidations
  const liquidationTrades = tradeFlow.trades.filter(trade => trade.liquidation);
  
  // Consider it a liquidation event if there are multiple liquidations
  return liquidationTrades.length >= 2;
}

/**
 * Detects volatility spikes
 */
function detectVolatilitySpike(tradeFlow: TradeFlowData, priceChange1m: number): boolean {
  // Check if price change is extreme
  const isExtremePrice = Math.abs(priceChange1m) > 1.5; // 1.5% in a minute is significant
  
  // Check if there are large orders
  const hasLargeOrders = tradeFlow.largeOrders.length >= 3;
  
  // Check if there's a significant imbalance between buys and sells
  const totalVolume = tradeFlow.buyVolume + tradeFlow.sellVolume;
  const volumeImbalance = Math.abs((tradeFlow.buyVolume - tradeFlow.sellVolume) / totalVolume);
  const isImbalanced = volumeImbalance > 0.7; // 70% imbalance
  
  return isExtremePrice || (hasLargeOrders && isImbalanced);
}

/**
 * Determines the immediate market trend
 */
function determineImmediateTrend(
  tradeFlow: TradeFlowData,
  orderBook: OrderBookSnapshot
): 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down' {
  // Factor 1: Buy/sell volume imbalance
  const totalVolume = tradeFlow.buyVolume + tradeFlow.sellVolume;
  const volumeRatio = totalVolume > 0 ? tradeFlow.buyVolume / totalVolume : 0.5;
  
  // Factor 2: Order book imbalance
  const orderBookImbalance = orderBook.liquidityImbalance / 100; // Normalize to -1 to 1
  
  // Factor 3: Recent price movement
  const recentTrades = [...tradeFlow.trades]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10); // Last 10 trades
  
  let priceDirection = 0;
  for (let i = 1; i < recentTrades.length; i++) {
    const priceDiff = recentTrades[i-1].price - recentTrades[i].price;
    priceDirection += Math.sign(priceDiff);
  }
  priceDirection = priceDirection / (recentTrades.length - 1); // Normalize to -1 to 1
  
  // Factor 4: Large orders direction
  const largeOrdersDirection = tradeFlow.largeOrders.length > 0 ?
    (tradeFlow.largeOrders.filter(o => o.side === 'buy').length / tradeFlow.largeOrders.length) - 0.5 : 0;
  
  // Combine factors with weights
  const trendScore = (
    (volumeRatio - 0.5) * 2 * 0.4 + // Volume imbalance (40% weight)
    orderBookImbalance * 0.3 + // Order book imbalance (30% weight)
    priceDirection * 0.2 + // Recent price direction (20% weight)
    largeOrdersDirection * 2 * 0.1 // Large orders direction (10% weight)
  );
  
  // Determine trend based on score
  if (trendScore > 0.6) return 'strong_up';
  if (trendScore > 0.2) return 'up';
  if (trendScore < -0.6) return 'strong_down';
  if (trendScore < -0.2) return 'down';
  return 'neutral';
}

/**
 * Calculates the strength of the current momentum
 */
function calculateMomentumStrength(
  tradeFlow: TradeFlowData,
  orderBook: OrderBookSnapshot,
  trend: 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down'
): number {
  // For neutral trend, momentum is low
  if (trend === 'neutral') return 20 + Math.random() * 10;
  
  // Determine direction multiplier
  const directionMultiplier = (trend === 'strong_up' || trend === 'up') ? 1 : -1;
  
  // Factor 1: Trend strength
  const trendStrength = trend === 'strong_up' || trend === 'strong_down' ? 1 : 0.6;
  
  // Factor 2: Volume pressure
  const volumePressure = Math.abs(tradeFlow.buyVolume - tradeFlow.sellVolume) / 
    (tradeFlow.buyVolume + tradeFlow.sellVolume);
  
  // Factor 3: Order book support/resistance
  const orderBookFactor = Math.abs(orderBook.liquidityImbalance) / 100;
  
  // Factor 4: Large orders impact
  const largeOrdersImpact = tradeFlow.largeOrders.reduce((sum, order) => {
    const sideMultiplier = order.side === 'buy' ? 1 : -1;
    return sum + (order.marketImpact / 100) * sideMultiplier;
  }, 0) / Math.max(1, tradeFlow.largeOrders.length);
  
  // Factor 5: Trade frequency
  const tradeFrequency = tradeFlow.trades.length / timeframeToMs(tradeFlow.timeframe) * 60000; // Normalized to per minute
  const frequencyFactor = Math.min(1, tradeFrequency / 30); // Cap at 30 trades per minute
  
  // Combine factors
  const rawStrength = (
    trendStrength * 0.3 +
    volumePressure * 0.25 +
    orderBookFactor * 0.2 +
    Math.abs(largeOrdersImpact) * 0.15 +
    frequencyFactor * 0.1
  ) * 100;
  
  // Adjust direction based on trend
  if (directionMultiplier * largeOrdersImpact < 0) {
    // If large orders are against the trend, reduce strength
    return Math.max(10, rawStrength * 0.7);
  }
  
  return Math.min(100, rawStrength);
}

/**
 * Detects market anomalies in real-time data
 */
function detectAnomalies(
  tradeFlow: TradeFlowData,
  orderBook: OrderBookSnapshot,
  priceChange1m: number
): { anomalyDetected: boolean; anomalyType?: 'price_spike' | 'volume_spike' | 'liquidity_withdrawal' | 'cascading_liquidations' } {
  // Check for price spike
  if (Math.abs(priceChange1m) > 2) {
    return { anomalyDetected: true, anomalyType: 'price_spike' };
  }
  
  // Check for volume spike
  const totalVolume = tradeFlow.buyVolume + tradeFlow.sellVolume;
  const averageTradeSize = totalVolume / tradeFlow.trades.length;
  const largeTradesCount = tradeFlow.trades.filter(t => t.quantity > averageTradeSize * 5).length;
  
  if (largeTradesCount > tradeFlow.trades.length * 0.2) { // More than 20% are large trades
    return { anomalyDetected: true, anomalyType: 'volume_spike' };
  }
  
  // Check for liquidity withdrawal
  const totalLiquidity = orderBook.bids.reduce((sum, [_, qty]) => sum + qty, 0) +
    orderBook.asks.reduce((sum, [_, qty]) => sum + qty, 0);
  
  // A very thin order book relative to trade volume
  if (totalLiquidity < totalVolume * 2) {
    return { anomalyDetected: true, anomalyType: 'liquidity_withdrawal' };
  }
  
  // Check for cascading liquidations
  const liquidationCount = tradeFlow.trades.filter(t => t.liquidation).length;
  if (liquidationCount > 3 || (liquidationCount > 0 && Math.abs(priceChange1m) > 1)) {
    return { anomalyDetected: true, anomalyType: 'cascading_liquidations' };
  }
  
  return { anomalyDetected: false };
}

/**
 * Calculates a trading signal from real-time market data
 */
function calculateRealTimeSignal(marketUpdate: RealTimeMarketUpdate): {
  signal: number; // -100 to 100
  confidence: number; // 0-100
  action?: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
} {
  // Start with the immediate trend direction
  let baseSignal = 0;
  switch (marketUpdate.immediateTrend) {
    case 'strong_up': baseSignal = 80; break;
    case 'up': baseSignal = 40; break;
    case 'neutral': baseSignal = 0; break;
    case 'down': baseSignal = -40; break;
    case 'strong_down': baseSignal = -80; break;
  }
  
  // Adjust based on momentum strength
  const momentumFactor = (marketUpdate.momentumStrength / 100) * 20; // Up to 20 points
  baseSignal = baseSignal > 0 ? 
    Math.min(100, baseSignal + momentumFactor) : 
    Math.max(-100, baseSignal - momentumFactor);
  
  // Reduce signal if anomaly detected
  if (marketUpdate.anomalyDetected) {
    baseSignal = baseSignal * 0.7; // Reduce signal strength during anomalies
  }
  
  // Calculate confidence based on multiple factors
  let confidence = 50; // Start with neutral confidence
  
  // Factor 1: Order book depth and liquidity
  const orderBook = marketUpdate.orderBookUpdate;
  const totalLiquidity = orderBook.bids.reduce((sum, [_, qty]) => sum + qty, 0) +
    orderBook.asks.reduce((sum, [_, qty]) => sum + qty, 0);
  
  // More liquidity = higher confidence
  confidence += Math.min(15, totalLiquidity / 100);
  
  // Factor 2: Volume consistency
  const tradeFlow = marketUpdate.tradeFlow;
  const volumeRatio = Math.min(tradeFlow.buyVolume, tradeFlow.sellVolume) / 
    Math.max(tradeFlow.buyVolume, tradeFlow.sellVolume);
  
  // More balanced volume = higher confidence
  confidence += volumeRatio * 10;
  
  // Factor 3: Price stability
  const isStable = Math.abs(marketUpdate.priceChange1m) < 0.5;
  confidence += isStable ? 10 : 0;
  
  // Factor 4: Number of trades
  confidence += Math.min(10, tradeFlow.trades.length / 10);
  
  // Reduce confidence for anomalies
  if (marketUpdate.anomalyDetected) {
    confidence -= 20;
  }
  
  // Cap confidence
  confidence = Math.max(10, Math.min(95, confidence));
  
  // Determine action based on signal
  let action: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' | undefined;
  
  if (baseSignal > 70 && confidence > 60) action = 'strong_buy';
  else if (baseSignal > 30) action = 'buy';
  else if (baseSignal < -70 && confidence > 60) action = 'strong_sell';
  else if (baseSignal < -30) action = 'sell';
  else action = 'hold';
  
  return {
    signal: baseSignal,
    confidence,
    action
  };
}

/**
 * Analyzes volume profile from market data
 */
function analyzeVolumeProfile(marketUpdate: RealTimeMarketUpdate): {
  buyPressure: number; // 0-100
  sellPressure: number; // 0-100
  largeOrderImpact: number; // -100 to 100
} {
  const tradeFlow = marketUpdate.tradeFlow;
  
  // Calculate buy pressure
  const totalVolume = tradeFlow.buyVolume + tradeFlow.sellVolume;
  const buyRatio = totalVolume > 0 ? tradeFlow.buyVolume / totalVolume : 0.5;
  const buyPressure = Math.min(100, buyRatio * 100 * 1.5); // Scale up slightly
  
  // Calculate sell pressure
  const sellRatio = totalVolume > 0 ? tradeFlow.sellVolume / totalVolume : 0.5;
  const sellPressure = Math.min(100, sellRatio * 100 * 1.5); // Scale up slightly
  
  // Calculate large order impact
  let largeOrderImpact = 0;
  if (tradeFlow.largeOrders.length > 0) {
    const buyImpact = tradeFlow.largeOrders
      .filter(order => order.side === 'buy')
      .reduce((sum, order) => sum + order.marketImpact, 0);
      
    const sellImpact = tradeFlow.largeOrders
      .filter(order => order.side === 'sell')
      .reduce((sum, order) => sum + order.marketImpact, 0);
    
    // Net impact (-100 to 100)
    largeOrderImpact = tradeFlow.largeOrders.length > 0 ?
      (buyImpact - sellImpact) / tradeFlow.largeOrders.length : 0;
  }
  
  return {
    buyPressure,
    sellPressure,
    largeOrderImpact
  };
}

/**
 * Creates anomaly alert with recommendations
 */
function createAnomalyAlert(
  anomalyType: string,
  marketUpdate: RealTimeMarketUpdate
): {
  type: string;
  severity: number; // 0-100
  recommendedAction: string;
} {
  let severity = 0;
  let recommendedAction = '';
  
  switch (anomalyType) {
    case 'price_spike':
      severity = 80;
      recommendedAction = marketUpdate.priceChange1m > 0 ?
        'Consider taking profits on long positions or setting tighter stop losses' :
        'Consider reducing short exposure until volatility normalizes';
      break;
      
    case 'volume_spike':
      severity = 65;
      recommendedAction = 'Await confirmation of direction; volume spike may signal trend exhaustion or continuation';
      break;
      
    case 'liquidity_withdrawal':
      severity = 90;
      recommendedAction = 'High risk environment; consider reducing position sizes and widening stop losses';
      break;
      
    case 'cascading_liquidations':
      severity = 95;
      recommendedAction = 'Extreme caution advised; avoid adding to positions until liquidation cascade completes';
      break;
      
    default:
      severity = 50;
      recommendedAction = 'Monitor situation closely';
  }
  
  return {
    type: anomalyType,
    severity,
    recommendedAction
  };
}
