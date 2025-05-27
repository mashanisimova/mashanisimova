'use server';

// This module analyzes order flow and market microstructure patterns to identify manipulations
// and inform trading decisions based on actual trading activity (not just the order book)

export type OrderFlowData = {
  timestamp: number;
  symbol: string;
  timeframe: string; // Granularity of the data (1m, 5m, etc.)
  metrics: {
    // Buy vs Sell pressure
    buyVolume: number; // Volume of buy market orders
    sellVolume: number; // Volume of sell market orders
    netFlow: number; // buyVolume - sellVolume
    buyOrderCount: number; // Number of buy orders
    sellOrderCount: number; // Number of sell orders
    averageBuySize: number; // Average size of buy orders
    averageSellSize: number; // Average size of sell orders
    // Delta metrics
    delta: number; // Change in price * volume during period
    cumulativeDelta: number; // Running sum of delta
    deltaExtremes: { // Points of maximum bullish/bearish order flow
      maxBullish: number;
      maxBearish: number;
    };
    // Market prints
    largeOrders: { // Significant individual orders
      side: 'buy' | 'sell';
      price: number;
      size: number;
      time: number;
    }[];
    absorptionEvents: { // When large orders don't move price as expected
      side: 'buy' | 'sell';
      price: number;
      size: number;
      time: number;
      absorption: number; // 0-100, how much was absorbed
    }[];
  };
  footprint: { // Price x Volume heatmap
    pricePoints: number[];
    buyVolumes: number[];
    sellVolumes: number[];
    imbalances: number[]; // Normalized imbalance at each price point
  };
  patterns: { // Detected order flow patterns
    type: 'absorption' | 'stopHunt' | 'iceberg' | 'stackedImbalance' | 'exhaustion' | 'momentumBuild';
    description: string;
    significance: number; // 0-100
    direction: 'bullish' | 'bearish' | 'neutral';
    price: number;
  }[];
  signal: 'buy' | 'sell' | 'neutral';
  signalStrength: number; // 0-100
  commentary: string;
};

// Analyze order flow to detect patterns and generate signals
export async function analyzeOrderFlow(
  symbol: string,
  timeframe: string = '5m',
  periods: number = 12 // Default to last hour for 5m timeframe
): Promise<OrderFlowData> {
  console.log(`Analyzing order flow for ${symbol} on ${timeframe} timeframe (${periods} periods)`);
  
  // In a production environment, this would use real-time trade data from the exchange
  // Here we'll simulate realistic order flow patterns
  
  const currentPrice = 30000 + (Math.random() * 10000); // Mock price between 30-40k for BTC
  const priceRange = currentPrice * 0.01; // 1% price range for the analysis period
  
  // Generate realistic buy and sell volumes
  // Real markets tend to have asymmetric buy/sell volumes
  const baseVolume = 100 + (Math.random() * 100); // Base volume per period
  const volumeTrend = Math.random() > 0.5 ? 1.2 : 0.8; // Biased trend in one direction
  
  const buyVolume = baseVolume * volumeTrend;
  const sellVolume = baseVolume / volumeTrend;
  const netFlow = buyVolume - sellVolume;
  
  // Generate trade counts with some realistic proportions
  const buyOrderCount = Math.floor(buyVolume / (2 + Math.random() * 3)); // Average order size 2-5 BTC
  const sellOrderCount = Math.floor(sellVolume / (2 + Math.random() * 3));
  
  // Calculate average order sizes
  const averageBuySize = buyVolume / buyOrderCount;
  const averageSellSize = sellVolume / sellOrderCount;
  
  // Simulate delta (price change * volume)
  // This is a key order flow metric that shows conviction
  const priceChange = (volumeTrend > 1 ? 1 : -1) * (Math.random() * priceRange);
  const delta = priceChange * (buyVolume + sellVolume);
  const cumulativeDelta = delta * periods * Math.random(); // Simulate accumulation over time
  
  // Generate large orders (whales)
  const largeOrders: { side: 'buy' | 'sell'; price: number; size: number; time: number; }[] = [];
  const largeOrderThreshold = baseVolume * 0.7; // 70% of base volume is considered large
  
  // 20% chance of having a large order
  if (Math.random() < 0.2) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const size = largeOrderThreshold + (Math.random() * largeOrderThreshold);
    const orderPrice = currentPrice * (side === 'buy' ? (1 - Math.random() * 0.005) : (1 + Math.random() * 0.005));
    
    largeOrders.push({
      side,
      price: orderPrice,
      size,
      time: Date.now() - Math.floor(Math.random() * 1000 * 60 * 5) // Random time in the last 5 minutes
    });
  }
  
  // Generate absorption events
  // These occur when large orders don't move price as expected (indicating strong counterflow)
  const absorptionEvents: { side: 'buy' | 'sell'; price: number; size: number; time: number; absorption: number; }[] = [];
  
  // 10% chance of having an absorption event
  if (Math.random() < 0.1) {
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const size = largeOrderThreshold + (Math.random() * largeOrderThreshold);
    const orderPrice = currentPrice * (side === 'buy' ? (1 - Math.random() * 0.003) : (1 + Math.random() * 0.003));
    const absorption = 70 + Math.random() * 30; // 70-100% absorption
    
    absorptionEvents.push({
      side,
      price: orderPrice,
      size,
      time: Date.now() - Math.floor(Math.random() * 1000 * 60 * 5),
      absorption
    });
  }
  
  // Generate price x volume footprint data
  const numPricePoints = 10;
  const priceStep = priceRange / numPricePoints;
  
  const pricePoints = [];
  const buyVolumes = [];
  const sellVolumes = [];
  const imbalances = [];
  
  let startPrice = currentPrice - (priceRange / 2);
  
  for (let i = 0; i < numPricePoints; i++) {
    const price = startPrice + (i * priceStep);
    pricePoints.push(price);
    
    // Volume tends to be higher near the current price
    const distanceFromMid = Math.abs(price - currentPrice) / (priceRange / 2);
    const volumeFactor = 1 - (distanceFromMid * 0.8); // More volume near current price
    
    // Random but related buy/sell volumes at each price point
    const pricePointBuyVolume = baseVolume * volumeFactor * (0.5 + Math.random() * 1.0) * 
                              (price < currentPrice ? 1.2 : 0.8); // More buys below current price
    
    const pricePointSellVolume = baseVolume * volumeFactor * (0.5 + Math.random() * 1.0) * 
                               (price > currentPrice ? 1.2 : 0.8); // More sells above current price
    
    buyVolumes.push(pricePointBuyVolume);
    sellVolumes.push(pricePointSellVolume);
    
    // Calculate imbalance (-100 to 100, negative means sell heavy)
    const totalVolume = pricePointBuyVolume + pricePointSellVolume;
    const imbalance = totalVolume > 0 ? 
      ((pricePointBuyVolume - pricePointSellVolume) / totalVolume) * 100 : 0;
    
    imbalances.push(imbalance);
  }
  
  // Detect order flow patterns
  const patterns: { type: 'absorption' | 'stopHunt' | 'iceberg' | 'stackedImbalance' | 'exhaustion' | 'momentumBuild'; description: string; significance: number; direction: 'bullish' | 'bearish' | 'neutral'; price: number; }[] = [];
  
  // Check for absorption pattern
  if (absorptionEvents.length > 0) {
    const event = absorptionEvents[0];
    patterns.push({
      type: 'absorption',
      description: `Large ${event.side} orders absorbed without significant price movement`,
      significance: event.absorption,
      direction: event.side === 'buy' ? 'bullish' : 'bearish',
      price: event.price
    });
  }
  
  // Check for stacked imbalance (multiple price levels with same directional imbalance)
  let stackedBullishImbalances = 0;
  let stackedBearishImbalances = 0;
  
  for (const imbalance of imbalances) {
    if (imbalance > 30) stackedBullishImbalances++;
    if (imbalance < -30) stackedBearishImbalances++;
  }
  
  if (stackedBullishImbalances >= 3) {
    patterns.push({
      type: 'stackedImbalance',
      description: `${stackedBullishImbalances} stacked bullish imbalances detected`,
      significance: 60 + (stackedBullishImbalances * 5),
      direction: 'bullish',
      price: currentPrice
    });
  } else if (stackedBearishImbalances >= 3) {
    patterns.push({
      type: 'stackedImbalance',
      description: `${stackedBearishImbalances} stacked bearish imbalances detected`,
      significance: 60 + (stackedBearishImbalances * 5),
      direction: 'bearish',
      price: currentPrice
    });
  }
  
  // Check for stop hunt pattern (large opposing orders followed by price reversion)
  if (Math.random() < 0.1) { // 10% chance of stop hunt
    const direction = Math.random() > 0.5 ? 'bullish' : 'bearish';
    patterns.push({
      type: 'stopHunt',
      description: `Potential ${direction === 'bullish' ? 'downside' : 'upside'} stop hunt detected with price reversion`,
      significance: 70 + (Math.random() * 20),
      direction,
      price: currentPrice * (direction === 'bullish' ? 0.995 : 1.005)
    });
  }
  
  // Check for exhaustion pattern (large volume spike with price failure)
  if (Math.random() < 0.1 && (buyVolume > sellVolume * 2 || sellVolume > buyVolume * 2)) {
    const direction = buyVolume > sellVolume ? 'bearish' : 'bullish'; // Counter-trend signal
    patterns.push({
      type: 'exhaustion',
      description: `Volume exhaustion detected at ${currentPrice.toFixed(2)}`,
      significance: 75 + (Math.random() * 15),
      direction,
      price: currentPrice
    });
  }
  
  // Check for momentum build pattern
  if (Math.abs(netFlow) > baseVolume * 0.5 && Math.abs(delta) > 0) {
    const direction = netFlow > 0 ? 'bullish' : 'bearish';
    patterns.push({
      type: 'momentumBuild',
      description: `Order flow momentum building in ${direction} direction`,
      significance: 50 + (Math.abs(netFlow) / baseVolume) * 30,
      direction,
      price: currentPrice
    });
  }
  
  // Determine the overall signal based on patterns and metrics
  let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
  let signalStrength = 0;
  
  // Score bullish and bearish factors
  let bullishScore = 0;
  let bearishScore = 0;
  
  // Volume-based factors
  if (netFlow > 0) bullishScore += Math.min(50, (netFlow / baseVolume) * 50);
  else bearishScore += Math.min(50, (Math.abs(netFlow) / baseVolume) * 50);
  
  // Delta factors
  if (delta > 0) bullishScore += Math.min(30, (delta / (baseVolume * priceStep)) * 30);
  else bearishScore += Math.min(30, (Math.abs(delta) / (baseVolume * priceStep)) * 30);
  
  // Pattern factors
  for (const pattern of patterns) {
    const patternScore = pattern.significance * 0.2; // Scale pattern significance 
    if (pattern.direction === 'bullish') bullishScore += patternScore;
    else if (pattern.direction === 'bearish') bearishScore += patternScore;
  }
  
  // Determine overall signal
  if (bullishScore > bearishScore + 10) {
    signal = 'buy';
    signalStrength = bullishScore;
  } else if (bearishScore > bullishScore + 10) {
    signal = 'sell';
    signalStrength = bearishScore;
  } else {
    signal = 'neutral';
    signalStrength = 20; // Base neutral strength
  }
  
  // Cap signal strength at 100
  signalStrength = Math.min(100, signalStrength);
  
  // Generate commentary
  let commentary = '';
  if (signal === 'buy') {
    commentary = `Bullish order flow detected with ${netFlow.toFixed(1)} net buy volume. `;
    if (patterns.filter(p => p.direction === 'bullish').length > 0) {
      commentary += `Supported by ${patterns.filter(p => p.direction === 'bullish').length} bullish patterns. `;
    }
    commentary += `Strong buying at ${pricePoints[imbalances.indexOf(Math.max(...imbalances))].toFixed(2)}.`;
  } else if (signal === 'sell') {
    commentary = `Bearish order flow detected with ${Math.abs(netFlow).toFixed(1)} net sell volume. `;
    if (patterns.filter(p => p.direction === 'bearish').length > 0) {
      commentary += `Supported by ${patterns.filter(p => p.direction === 'bearish').length} bearish patterns. `;
    }
    commentary += `Strong selling at ${pricePoints[imbalances.indexOf(Math.min(...imbalances))].toFixed(2)}.`;
  } else {
    commentary = `Balanced order flow with no clear directional bias. Continue monitoring for developing patterns.`;
  }
  
  // Return the full order flow analysis
  return {
    timestamp: Date.now(),
    symbol,
    timeframe,
    metrics: {
      buyVolume,
      sellVolume,
      netFlow,
      buyOrderCount,
      sellOrderCount,
      averageBuySize,
      averageSellSize,
      delta,
      cumulativeDelta,
      deltaExtremes: {
        maxBullish: cumulativeDelta * 1.2,
        maxBearish: cumulativeDelta * 0.8
      },
      largeOrders,
      absorptionEvents
    },
    footprint: {
      pricePoints,
      buyVolumes,
      sellVolumes,
      imbalances
    },
    patterns,
    signal,
    signalStrength,
    commentary
  };
}

// Analyze market microstructure across multiple timeframes to identify divergences
export async function analyzeMicrostructureDivergence(
  symbol: string,
  timeframes: string[] = ['1m', '5m', '15m', '1h']
): Promise<{
  timeframeAnalyses: Record<string, OrderFlowData>;
  divergences: {
    type: 'bullish' | 'bearish' | 'neutral';
    description: string;
    significance: number; // 0-100
    timeframes: string[];
  }[];
  overall: {
    signal: 'buy' | 'sell' | 'neutral';
    strength: number;
    confidence: number; // 0-100
    commentary: string;
  };
}> {
  console.log(`Analyzing microstructure divergence for ${symbol} across timeframes:`, timeframes);
  
  // Gather order flow analysis for each timeframe
  const timeframeAnalyses: Record<string, OrderFlowData> = {};
  
  for (const timeframe of timeframes) {
    // Number of periods to analyze for each timeframe
    const periods = timeframe === '1m' ? 30 : 
                   timeframe === '5m' ? 12 : 
                   timeframe === '15m' ? 8 : 
                   timeframe === '1h' ? 6 : 4;
                   
    timeframeAnalyses[timeframe] = await analyzeOrderFlow(symbol, timeframe, periods);
  }
  
  // Detect divergences between timeframes
  const divergences = [];
  
  // Check for divergences between adjacent timeframes
  for (let i = 0; i < timeframes.length - 1; i++) {
    const shortTf = timeframes[i];
    const longTf = timeframes[i + 1];
    
    const shortAnalysis = timeframeAnalyses[shortTf];
    const longAnalysis = timeframeAnalyses[longTf];
    
    // Bullish divergence: short-term bearish but longer-term bullish
    if (shortAnalysis.signal === 'sell' && longAnalysis.signal === 'buy') {
      divergences.push({
        type: 'bullish',
        description: `Bullish divergence between ${shortTf} (bearish) and ${longTf} (bullish)`,
        significance: (shortAnalysis.signalStrength + longAnalysis.signalStrength) / 2,
        timeframes: [shortTf, longTf]
      });
    }
    
    // Bearish divergence: short-term bullish but longer-term bearish
    else if (shortAnalysis.signal === 'buy' && longAnalysis.signal === 'sell') {
      divergences.push({
        type: 'bearish',
        description: `Bearish divergence between ${shortTf} (bullish) and ${longTf} (bearish)`,
        significance: (shortAnalysis.signalStrength + longAnalysis.signalStrength) / 2,
        timeframes: [shortTf, longTf]
      });
    }
    
    // Check for delta divergence (price vs order flow)
    const shortDelta = shortAnalysis.metrics.delta;
    const longDelta = longAnalysis.metrics.delta;
    
    if ((shortDelta > 0 && longDelta < 0) || (shortDelta < 0 && longDelta > 0)) {
      divergences.push({
        type: shortDelta < 0 && longDelta > 0 ? 'bullish' : 'bearish',
        description: `Delta divergence between ${shortTf} and ${longTf}`,
        significance: Math.min(70, (Math.abs(shortDelta) + Math.abs(longDelta)) / 2),
        timeframes: [shortTf, longTf]
      });
    }
  }
  
  // Calculate overall signal across all timeframes
  let bullishScore = 0;
  let bearishScore = 0;
  let totalWeight = 0;
  
  // Timeframe weights - longer timeframes have more weight
  const weights = {
    '1m': 0.5,
    '5m': 1.0,
    '15m': 1.5,
    '1h': 2.0,
    '4h': 2.5,
    '1d': 3.0
  };
  
  // Calculate weighted scores
  for (const [timeframe, analysis] of Object.entries(timeframeAnalyses)) {
    const weight = weights[timeframe as keyof typeof weights] || 1.0;
    totalWeight += weight;
    
    if (analysis.signal === 'buy') {
      bullishScore += analysis.signalStrength * weight;
    } else if (analysis.signal === 'sell') {
      bearishScore += analysis.signalStrength * weight;
    }
  }
  
  // Add divergence scores
  for (const divergence of divergences) {
    const divergenceWeight = 1.0;
    totalWeight += divergenceWeight;
    
    if (divergence.type === 'bullish') {
      bullishScore += divergence.significance * divergenceWeight;
    } else if (divergence.type === 'bearish') {
      bearishScore += divergence.significance * divergenceWeight;
    }
  }
  
  // Normalize scores
  bullishScore = totalWeight > 0 ? bullishScore / totalWeight : 0;
  bearishScore = totalWeight > 0 ? bearishScore / totalWeight : 0;
  
  // Determine overall signal
  let overallSignal: 'buy' | 'sell' | 'neutral';
  let overallStrength: number;
  let confidence: number;
  
  if (bullishScore > bearishScore * 1.2) {
    overallSignal = 'buy';
    overallStrength = bullishScore;
    confidence = Math.min(100, 60 + (bullishScore - bearishScore) * 0.5);
  } else if (bearishScore > bullishScore * 1.2) {
    overallSignal = 'sell';
    overallStrength = bearishScore;
    confidence = Math.min(100, 60 + (bearishScore - bullishScore) * 0.5);
  } else {
    overallSignal = 'neutral';
    overallStrength = Math.max(bullishScore, bearishScore) * 0.5;
    confidence = Math.min(100, 40 + Math.abs(bullishScore - bearishScore) * 0.5);
  }
  
  // Generate commentary
  let commentary = '';
  if (overallSignal === 'buy') {
    commentary = `Bullish microstructure across ${Object.keys(timeframeAnalyses).length} timeframes`;
    if (divergences.filter(d => d.type === 'bullish').length > 0) {
      commentary += ` with ${divergences.filter(d => d.type === 'bullish').length} bullish divergences`;
    }
    commentary += '.'
  } else if (overallSignal === 'sell') {
    commentary = `Bearish microstructure across ${Object.keys(timeframeAnalyses).length} timeframes`;
    if (divergences.filter(d => d.type === 'bearish').length > 0) {
      commentary += ` with ${divergences.filter(d => d.type === 'bearish').length} bearish divergences`;
    }
    commentary += '.'
  } else {
    commentary = `Mixed signals across timeframes with no clear directional bias.`;
  }
  
  return {
    timeframeAnalyses,
    divergences,
    overall: {
      signal: overallSignal,
      strength: overallStrength,
      confidence,
      commentary
    }
  };
}
