'use server';

import axios from 'axios';

export type MarketLiquidityData = {
  timestamp: number;
  symbol: string;
  asks: {
    price: number;
    quantity: number;
    total: number;
  }[];
  bids: {
    price: number;
    quantity: number;
    total: number;
  }[];
  metrics: {
    spreadPercentage: number; // Current spread as percentage
    bidAskRatio: number; // Ratio of total bid quantity to ask quantity
    liquidityDepth: number; // Volume within 2% of mid price
    totalBidVolume: number;
    totalAskVolume: number;
    nearestBigSupport: number; // Price level of nearest major support
    nearestBigResistance: number; // Price level of nearest major resistance
    volumeProfile: Record<string, number>; // Volume by price level
  };
  whaleActivityDetected: boolean;
  whaleThresholdUSD: number; // Threshold for whale order detection in USD
  largeOrders: {
    side: 'bid' | 'ask';
    price: number;
    quantity: number;
    value: number; // in USD
  }[];
  signal: 'buy' | 'sell' | 'neutral';
  signalStrength: number; // 0-100
  signalDescription: string;
};

// Function to analyze market liquidity and order book structure
export async function analyzeMarketLiquidity(symbol: string): Promise<MarketLiquidityData> {
  console.log(`Analyzing market liquidity for ${symbol}`);
  
  // In a real implementation, this would fetch actual order book data from the exchange API
  // For this example, we'll generate mock data that represents realistic order book patterns
  
  // Get a simulated mid price
  const midPrice = 30000 + (Math.random() * 10000); // For BTC, in the 30-40k range
  const spreadPercentage = 0.01 + (Math.random() * 0.05); // 0.01% to 0.06% spread
  
  // Generate ask prices higher than mid price
  const asks = [];
  let askPrice = midPrice * (1 + spreadPercentage/200); // Half the spread above mid
  let askTotal = 0;
  
  for (let i = 0; i < 20; i++) {
    // More liquidity near the mid price, decreasing as we move away
    const priceStep = askPrice * (0.0001 + (i * 0.00005)); // 0.01% steps, increasing
    askPrice += priceStep;
    
    // Random quantity with some large orders occasionally
    let quantity = Math.random() * 2;
    if (Math.random() < 0.1) { // 10% chance of a larger order
      quantity += Math.random() * 8;
    }
    
    askTotal += quantity;
    asks.push({
      price: askPrice,
      quantity,
      total: askTotal
    });
  }
  
  // Generate bid prices lower than mid price
  const bids = [];
  let bidPrice = midPrice * (1 - spreadPercentage/200); // Half the spread below mid
  let bidTotal = 0;
  
  for (let i = 0; i < 20; i++) {
    // More liquidity near the mid price, decreasing as we move away
    const priceStep = bidPrice * (0.0001 + (i * 0.00005)); // 0.01% steps, increasing
    bidPrice -= priceStep;
    
    // Random quantity with some large orders occasionally
    let quantity = Math.random() * 2;
    if (Math.random() < 0.1) { // 10% chance of a larger order
      quantity += Math.random() * 8;
    }
    
    bidTotal += quantity;
    bids.push({
      price: bidPrice,
      quantity,
      total: bidTotal
    });
  }
  
  // Find key support/resistance levels (large orders)
  const whaleThresholdBTC = 5; // Orders bigger than 5 BTC are considered whale orders
  const whaleThresholdUSD = whaleThresholdBTC * midPrice;
  const largeOrders = [];
  
  // Look for large orders in bids
  let nearestBigSupport = 0;
  for (const bid of bids) {
    if (bid.quantity > whaleThresholdBTC && nearestBigSupport === 0) {
      nearestBigSupport = bid.price;
    }
    
    if (bid.quantity > whaleThresholdBTC) {
      largeOrders.push({
        side: 'bid',
        price: bid.price,
        quantity: bid.quantity,
        value: bid.price * bid.quantity
      });
    }
  }
  
  // Look for large orders in asks
  let nearestBigResistance = 0;
  for (const ask of asks) {
    if (ask.quantity > whaleThresholdBTC && nearestBigResistance === 0) {
      nearestBigResistance = ask.price;
    }
    
    if (ask.quantity > whaleThresholdBTC) {
      largeOrders.push({
        side: 'ask',
        price: ask.price,
        quantity: ask.quantity,
        value: ask.price * ask.quantity
      });
    }
  }
  
  // If no big support/resistance found, use the furthest levels
  if (nearestBigSupport === 0) nearestBigSupport = bids[bids.length - 1].price;
  if (nearestBigResistance === 0) nearestBigResistance = asks[asks.length - 1].price;
  
  // Calculate volume profile (distribution of volume across price levels)
  const volumeProfile: Record<string, number> = {};
  const priceStep = midPrice * 0.005; // 0.5% price bins
  
  for (const bid of bids) {
    const bin = Math.floor(bid.price / priceStep) * priceStep;
    const binKey = bin.toFixed(0);
    volumeProfile[binKey] = (volumeProfile[binKey] || 0) + bid.quantity;
  }
  
  for (const ask of asks) {
    const bin = Math.floor(ask.price / priceStep) * priceStep;
    const binKey = bin.toFixed(0);
    volumeProfile[binKey] = (volumeProfile[binKey] || 0) + ask.quantity;
  }
  
  // Calculate metrics
  const totalBidVolume = bidTotal;
  const totalAskVolume = askTotal;
  const bidAskRatio = totalBidVolume / totalAskVolume;
  
  // Calculate liquidity depth (volume within 2% of mid price)
  let liquidityDepth = 0;
  const depthThreshold = midPrice * 0.02; // 2%
  
  for (const bid of bids) {
    if (midPrice - bid.price <= depthThreshold) {
      liquidityDepth += bid.quantity;
    }
  }
  
  for (const ask of asks) {
    if (ask.price - midPrice <= depthThreshold) {
      liquidityDepth += ask.quantity;
    }
  }
  
  // Determine if whale activity is present
  const whaleActivityDetected = largeOrders.length > 0;
  
  // Generate trading signal based on order book analysis
  let signal: 'buy' | 'sell' | 'neutral';
  let signalStrength: number;
  let signalDescription: string;
  
  if (bidAskRatio > 1.5) {
    // Strong buying pressure
    signal = 'buy';
    signalStrength = Math.min(100, (bidAskRatio - 1) * 50);
    signalDescription = `Strong buying pressure with ${bidAskRatio.toFixed(2)}x more bids than asks`;
  } else if (bidAskRatio < 0.67) {
    // Strong selling pressure
    signal = 'sell';
    signalStrength = Math.min(100, (1 - bidAskRatio) * 50);
    signalDescription = `Strong selling pressure with ${(1/bidAskRatio).toFixed(2)}x more asks than bids`;
  } else {
    // Balanced order book
    signal = 'neutral';
    signalStrength = 20 + Math.random() * 20; // 20-40 range for neutral signals
    signalDescription = 'Balanced order book with no significant pressure in either direction';
  }
  
  // Adjust signal based on large orders
  if (whaleActivityDetected) {
    const bidWhales = largeOrders.filter(order => order.side === 'bid');
    const askWhales = largeOrders.filter(order => order.side === 'ask');
    
    const totalBidWhaleVolume = bidWhales.reduce((sum, order) => sum + order.value, 0);
    const totalAskWhaleVolume = askWhales.reduce((sum, order) => sum + order.value, 0);
    
    if (totalBidWhaleVolume > totalAskWhaleVolume * 2) {
      // Strong whale buying
      signal = 'buy';
      signalStrength = Math.min(100, 60 + (totalBidWhaleVolume / whaleThresholdUSD) * 5);
      signalDescription = `Large buy orders detected totaling ${(totalBidWhaleVolume/1000000).toFixed(2)}M USD`;
    } else if (totalAskWhaleVolume > totalBidWhaleVolume * 2) {
      // Strong whale selling
      signal = 'sell';
      signalStrength = Math.min(100, 60 + (totalAskWhaleVolume / whaleThresholdUSD) * 5);
      signalDescription = `Large sell orders detected totaling ${(totalAskWhaleVolume/1000000).toFixed(2)}M USD`;
    }
  }
  
  // Return compiled analysis
  return {
    timestamp: Date.now(),
    symbol,
    asks,
    bids,
    metrics: {
      spreadPercentage,
      bidAskRatio,
      liquidityDepth,
      totalBidVolume,
      totalAskVolume,
      nearestBigSupport,
      nearestBigResistance,
      volumeProfile
    },
    whaleActivityDetected,
    whaleThresholdUSD,
    largeOrders,
    signal,
    signalStrength,
    signalDescription
  };
}

// Function to detect sudden changes in liquidity (potential market manipulation)
export async function detectLiquidityChanges(
  symbol: string,
  previousData?: MarketLiquidityData
): Promise<{
  liquiditySpiked: boolean;
  liquidityDrained: boolean;
  wallMoved: boolean;
  spoofinSuspected: boolean;
  suspiciousActivity: string[];
  action: 'caution' | 'opportunity' | 'none';
}> {
  console.log(`Detecting liquidity changes for ${symbol}`);
  
  // Get current liquidity data
  const currentData = await analyzeMarketLiquidity(symbol);
  
  // If no previous data, return current data with no changes detected
  if (!previousData) {
    return {
      liquiditySpiked: false,
      liquidityDrained: false,
      wallMoved: false,
      spoofinSuspected: false,
      suspiciousActivity: [],
      action: 'none'
    };
  }
  
  // Check for significant changes in liquidity
  const liquidityChangePct = (
    (currentData.metrics.liquidityDepth - previousData.metrics.liquidityDepth) /
    previousData.metrics.liquidityDepth
  ) * 100;
  
  const liquiditySpiked = liquidityChangePct > 50; // 50% increase in liquidity
  const liquidityDrained = liquidityChangePct < -50; // 50% decrease in liquidity
  
  // Check if support/resistance walls have moved
  const supportMovePct = (
    (currentData.metrics.nearestBigSupport - previousData.metrics.nearestBigSupport) /
    previousData.metrics.nearestBigSupport
  ) * 100;
  
  const resistanceMovePct = (
    (currentData.metrics.nearestBigResistance - previousData.metrics.nearestBigResistance) /
    previousData.metrics.nearestBigResistance
  ) * 100;
  
  const wallMoved = Math.abs(supportMovePct) > 1 || Math.abs(resistanceMovePct) > 1;
  
  // Check for potential spoofing
  // Spoofing = large orders that appeared and then disappeared without being filled
  const spoofinSuspected = false; // This would require time series analysis in a real implementation
  
  // Compile suspicious activity report
  const suspiciousActivity: string[] = [];
  
  if (liquiditySpiked) {
    suspiciousActivity.push(`Liquidity spiked by ${liquidityChangePct.toFixed(1)}% - possible manipulation`);
  }
  
  if (liquidityDrained) {
    suspiciousActivity.push(`Liquidity drained by ${Math.abs(liquidityChangePct).toFixed(1)}% - possible incoming volatility`);
  }
  
  if (wallMoved) {
    if (Math.abs(supportMovePct) > 1) {
      suspiciousActivity.push(`Support wall moved ${supportMovePct > 0 ? 'up' : 'down'} by ${Math.abs(supportMovePct).toFixed(1)}%`);
    }
    if (Math.abs(resistanceMovePct) > 1) {
      suspiciousActivity.push(`Resistance wall moved ${resistanceMovePct > 0 ? 'up' : 'down'} by ${Math.abs(resistanceMovePct).toFixed(1)}%`);
    }
  }
  
  // Determine action
  let action: 'caution' | 'opportunity' | 'none' = 'none';
  
  if (liquidityDrained || spoofinSuspected) {
    action = 'caution'; // Be cautious when liquidity drains or manipulation is suspected
  } else if (liquiditySpiked && currentData.signal !== 'neutral') {
    action = 'opportunity'; // Increased liquidity can be good for executing larger orders
  }
  
  return {
    liquiditySpiked,
    liquidityDrained,
    wallMoved,
    spoofinSuspected,
    suspiciousActivity,
    action
  };
}
