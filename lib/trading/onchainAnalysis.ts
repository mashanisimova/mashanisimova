'use server';

import axios from 'axios';

type OnChainMetric = {
  value: number;
  change24h: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  bullishSignal: boolean;
};

export type OnChainData = {
  timestamp: number;
  btcMetrics: {
    exchangeNetflow: OnChainMetric;
    minersNetflow: OnChainMetric;
    whaleTransactions: OnChainMetric;
    activeAddresses: OnChainMetric;
    soprRatio: OnChainMetric;
    nvtRatio: OnChainMetric;
    realizedCap: OnChainMetric;
    mvrv: OnChainMetric;
    longShortRatio: OnChainMetric;
    fundingRate: OnChainMetric;
    openInterest: OnChainMetric;
    liquidations: OnChainMetric;
  };
  ethMetrics?: {
    gasPrice: OnChainMetric;
    defiTvl: OnChainMetric;
    stakedEth: OnChainMetric;
    exchangeNetflow: OnChainMetric;
    activeAddresses: OnChainMetric;
  };
  solMetrics?: {
    networkGrowth: OnChainMetric;
    developerActivity: OnChainMetric;
    exchangeNetflow: OnChainMetric;
  };
  marketStructure: {
    liquidityDepth: OnChainMetric;
    orderBookImbalance: OnChainMetric;
    aggregatedFundingRates: OnChainMetric;
  };
  sentiment: {
    socialVolume: OnChainMetric;
    socialSentiment: OnChainMetric;
    twitterMentions: OnChainMetric;
    searchTrends: OnChainMetric;
    fearGreedIndex: OnChainMetric;
  };
};

// Mock API call to get on-chain data
// In production, connect to real data providers like Glassnode, CryptoQuant, Nansen, etc.
async function fetchOnChainData(symbol: string): Promise<OnChainData> {
  console.log(`Fetching on-chain data for ${symbol}`);
  
  // In a real implementation, this would call various APIs
  // For now, we'll use mock data that's representative of real patterns
  
  // Mock trend determination
  const getTrend = (value: number, threshold = 0): 'increasing' | 'decreasing' | 'stable' => {
    if (value > threshold) return 'increasing';
    if (value < -threshold) return 'decreasing';
    return 'stable';
  };
  
  // Generate realistic mock data
  const exchangeNetflow = Math.random() * 2 - 1.5; // Negative means outflow (bullish)
  const minersNetflow = Math.random() * 2 - 1; // Negative means miners holding (bullish)
  const fundingRate = Math.random() * 0.002 - 0.001; // Around -0.1% to 0.1%
  const liquidations24h = Math.random() * 100; // Millions USD
  
  return {
    timestamp: Date.now(),
    btcMetrics: {
      exchangeNetflow: {
        value: exchangeNetflow,
        change24h: Math.random() * 10 - 5,
        trend: getTrend(exchangeNetflow),
        bullishSignal: exchangeNetflow < 0 // Outflow from exchanges is bullish
      },
      minersNetflow: {
        value: minersNetflow,
        change24h: Math.random() * 5 - 2.5,
        trend: getTrend(minersNetflow),
        bullishSignal: minersNetflow < 0 // Miners holding is bullish
      },
      whaleTransactions: {
        value: Math.random() * 50 + 50,
        change24h: Math.random() * 20 - 10,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5 // Random for now
      },
      activeAddresses: {
        value: Math.random() * 100000 + 600000,
        change24h: Math.random() * 10 - 3,
        trend: getTrend(Math.random() * 3 - 1),
        bullishSignal: Math.random() > 0.4 // Slightly biased toward bullish
      },
      soprRatio: {
        value: Math.random() * 0.4 + 0.8, // 0.8 to 1.2
        change24h: Math.random() * 0.1 - 0.05,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      nvtRatio: {
        value: Math.random() * 40 + 20, // 20 to 60
        change24h: Math.random() * 10 - 5,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      realizedCap: {
        value: Math.random() * 40 + 380, // $380-420B
        change24h: Math.random() * 2 - 0.5, // Slightly biased positive
        trend: getTrend(Math.random() * 2 - 0.5),
        bullishSignal: Math.random() > 0.4 // Slightly biased toward bullish
      },
      mvrv: {
        value: Math.random() * 1.5 + 1, // 1.0 to 2.5
        change24h: Math.random() * 0.2 - 0.1,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      longShortRatio: {
        value: Math.random() * 2 + 0.5, // 0.5 to 2.5
        change24h: Math.random() * 0.3 - 0.15,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      fundingRate: {
        value: fundingRate,
        change24h: Math.random() * 0.001 - 0.0005,
        trend: getTrend(fundingRate, 0.0001),
        bullishSignal: fundingRate < 0 // Negative funding rate can be bullish
      },
      openInterest: {
        value: Math.random() * 5 + 10, // $10-15B
        change24h: Math.random() * 4 - 2,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      liquidations: {
        value: liquidations24h,
        change24h: Math.random() * 50 - 25,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: (Math.random() > 0.5) // Context dependent, can be both
      }
    },
    // Add ETH-specific metrics if symbol is ETH
    ...(symbol.includes('ETH') ? {
      ethMetrics: {
        gasPrice: {
          value: Math.random() * 50 + 20, // 20-70 gwei
          change24h: Math.random() * 20 - 10,
          trend: getTrend(Math.random() * 2 - 1),
          bullishSignal: Math.random() < 0.4 // Lower gas often better
        },
        defiTvl: {
          value: Math.random() * 20 + 30, // $30-50B
          change24h: Math.random() * 5 - 2,
          trend: getTrend(Math.random() * 2 - 1),
          bullishSignal: Math.random() > 0.5
        },
        stakedEth: {
          value: Math.random() * 10 + 20, // 20-30% of supply
          change24h: Math.random() * 1 - 0.2, // Slightly biased positive
          trend: getTrend(Math.random() * 2 - 0.5),
          bullishSignal: Math.random() > 0.4 // Higher staking is generally bullish
        },
        exchangeNetflow: {
          value: Math.random() * 2 - 1.5, // Negative means outflow (bullish)
          change24h: Math.random() * 10 - 5,
          trend: getTrend(Math.random() * 2 - 1),
          bullishSignal: Math.random() < 0.6 // Outflow is bullish
        },
        activeAddresses: {
          value: Math.random() * 200000 + 400000,
          change24h: Math.random() * 10 - 3,
          trend: getTrend(Math.random() * 3 - 1),
          bullishSignal: Math.random() > 0.4 // Slightly biased toward bullish
        }
      }
    } : {}),
    // Add SOL-specific metrics if symbol is SOL
    ...(symbol.includes('SOL') ? {
      solMetrics: {
        networkGrowth: {
          value: Math.random() * 20 + 10, // 10-30% growth
          change24h: Math.random() * 5 - 1, // Biased positive
          trend: getTrend(Math.random() * 2 - 0.5),
          bullishSignal: Math.random() > 0.3 // Likely bullish
        },
        developerActivity: {
          value: Math.random() * 1000 + 2000, // Github events
          change24h: Math.random() * 20 - 5, // Biased positive
          trend: getTrend(Math.random() * 2 - 0.5),
          bullishSignal: Math.random() > 0.3 // Likely bullish
        },
        exchangeNetflow: {
          value: Math.random() * 2 - 1.5, // Negative means outflow (bullish)
          change24h: Math.random() * 10 - 5,
          trend: getTrend(Math.random() * 2 - 1),
          bullishSignal: Math.random() < 0.6 // Outflow is bullish
        }
      }
    } : {}),
    marketStructure: {
      liquidityDepth: {
        value: Math.random() * 50 + 50, // Arbitrary scale
        change24h: Math.random() * 10 - 5,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5
      },
      orderBookImbalance: {
        value: Math.random() * 2 - 1, // -1 to 1, positive means more buy orders
        change24h: Math.random() * 0.4 - 0.2,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.4 // Buy imbalance is bullish
      },
      aggregatedFundingRates: {
        value: Math.random() * 0.002 - 0.001, // Around -0.1% to 0.1%
        change24h: Math.random() * 0.001 - 0.0005,
        trend: getTrend(Math.random() * 2 - 1, 0.0001),
        bullishSignal: Math.random() > 0.5
      },
    },
    sentiment: {
      socialVolume: {
        value: Math.random() * 50 + 50, // Arbitrary scale
        change24h: Math.random() * 20 - 10,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5 // Context dependent
      },
      socialSentiment: {
        value: Math.random() * 100 - 50, // -50 to +50
        change24h: Math.random() * 20 - 10,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.4 // Positive sentiment is bullish
      },
      twitterMentions: {
        value: Math.random() * 10000 + 5000,
        change24h: Math.random() * 30 - 15,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5 // Context dependent
      },
      searchTrends: {
        value: Math.random() * 100,
        change24h: Math.random() * 20 - 10,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() > 0.5 // Context dependent
      },
      fearGreedIndex: {
        value: Math.random() * 100, // 0-100
        change24h: Math.random() * 10 - 5,
        trend: getTrend(Math.random() * 2 - 1),
        bullishSignal: Math.random() < 0.5 // Lower values can be bullish (contrarian)
      }
    }
  };
}

// Process on-chain data into a signal
export async function getOnChainSignal(symbol: string): Promise<{
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  metrics: Record<string, { value: number; bullish: boolean }>;
}> {
  const data = await fetchOnChainData(symbol);
  console.log(`Processing on-chain data for ${symbol}`);
  
  // Extract all metrics into a flat structure
  const allMetrics: Record<string, OnChainMetric> = {};
  
  // Add BTC metrics
  Object.entries(data.btcMetrics).forEach(([key, value]) => {
    allMetrics[`btc_${key}`] = value;
  });
  
  // Add ETH metrics if available
  if (data.ethMetrics) {
    Object.entries(data.ethMetrics).forEach(([key, value]) => {
      allMetrics[`eth_${key}`] = value;
    });
  }
  
  // Add SOL metrics if available
  if (data.solMetrics) {
    Object.entries(data.solMetrics).forEach(([key, value]) => {
      allMetrics[`sol_${key}`] = value;
    });
  }
  
  // Add market structure metrics
  Object.entries(data.marketStructure).forEach(([key, value]) => {
    allMetrics[`market_${key}`] = value;
  });
  
  // Add sentiment metrics
  Object.entries(data.sentiment).forEach(([key, value]) => {
    allMetrics[`sentiment_${key}`] = value;
  });
  
  // Count bullish and bearish signals
  let bullishCount = 0;
  let bearishCount = 0;
  
  // Calculate weights based on metric importance
  const weights: Record<string, number> = {
    // Exchange flows are strong indicators
    btc_exchangeNetflow: 2.0,
    eth_exchangeNetflow: 1.5,
    sol_exchangeNetflow: 1.0,
    
    // On-chain activity
    btc_activeAddresses: 1.5,
    eth_activeAddresses: 1.2,
    
    // Market structure
    market_orderBookImbalance: 1.8,
    market_liquidityDepth: 1.2,
    
    // Derivatives market
    btc_fundingRate: 1.7,
    btc_longShortRatio: 1.6,
    btc_openInterest: 1.4,
    btc_liquidations: 1.3,
    
    // Network value metrics
    btc_nvtRatio: 1.5,
    btc_mvrv: 1.6,
    btc_realizedCap: 1.3,
    btc_soprRatio: 1.4,
    
    // Sentiment and social
    sentiment_fearGreedIndex: 1.0, // Lower weight as it's a contrarian indicator
    sentiment_socialSentiment: 1.1,
  };
  
  // Default weight for metrics not explicitly set
  const defaultWeight = 1.0;
  
  // Weighted count of signals
  let weightedBullish = 0;
  let weightedBearish = 0;
  let totalWeight = 0;
  
  // Prepare metrics for response
  const responseMetrics: Record<string, { value: number; bullish: boolean }> = {};
  
  // Process each metric
  Object.entries(allMetrics).forEach(([key, metric]) => {
    const weight = weights[key] || defaultWeight;
    totalWeight += weight;
    
    if (metric.bullishSignal) {
      bullishCount++;
      weightedBullish += weight;
    } else {
      bearishCount++;
      weightedBearish += weight;
    }
    
    // Add to response metrics
    responseMetrics[key] = {
      value: metric.value,
      bullish: metric.bullishSignal
    };
  });
  
  // Calculate overall signal
  const weightedRatio = totalWeight > 0 ? weightedBullish / totalWeight : 0.5;
  const signalStrength = Math.abs(weightedRatio - 0.5) * 200; // Convert to 0-100 scale
  
  // Determine signal direction
  let signal: 'buy' | 'sell' | 'neutral';
  if (weightedRatio > 0.55) {
    signal = 'buy';
  } else if (weightedRatio < 0.45) {
    signal = 'sell';
  } else {
    signal = 'neutral';
  }
  
  console.log(`On-chain signal for ${symbol}: ${signal} with strength ${signalStrength.toFixed(2)}`);
  console.log(`Bullish metrics: ${bullishCount}, Bearish metrics: ${bearishCount}`);
  
  return {
    signal,
    strength: signalStrength,
    metrics: responseMetrics
  };
}

// Get detailed order book and liquidity analysis
export async function getOrderBookAnalysis(symbol: string): Promise<{
  buyWallStrength: number; // 0-100
  sellWallStrength: number; // 0-100
  imbalanceDirection: 'buy' | 'sell' | 'neutral';
  imbalanceStrength: number; // 0-100
  liquidityScore: number; // 0-100
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
}> {
  // In a real implementation, fetch actual order book data from exchange API
  console.log(`Analyzing order book for ${symbol}`);
  
  // Generate realistic mock data
  const buyWallStrength = Math.random() * 100;
  const sellWallStrength = Math.random() * 100;
  const imbalanceRaw = buyWallStrength - sellWallStrength;
  const imbalanceStrength = Math.min(100, Math.abs(imbalanceRaw) * 1.5);
  const liquidityScore = Math.min(100, (buyWallStrength + sellWallStrength) / 3);
  
  let imbalanceDirection: 'buy' | 'sell' | 'neutral';
  if (imbalanceRaw > 10) {
    imbalanceDirection = 'buy';
  } else if (imbalanceRaw < -10) {
    imbalanceDirection = 'sell';
  } else {
    imbalanceDirection = 'neutral';
  }
  
  // Trading signal based on imbalance
  let signal: 'buy' | 'sell' | 'neutral';
  if (imbalanceDirection === 'buy' && imbalanceStrength > 30) {
    signal = 'buy';
  } else if (imbalanceDirection === 'sell' && imbalanceStrength > 30) {
    signal = 'sell';
  } else {
    signal = 'neutral';
  }
  
  const strength = imbalanceStrength * (liquidityScore / 100); // Higher liquidity gives more confidence
  
  return {
    buyWallStrength,
    sellWallStrength,
    imbalanceDirection,
    imbalanceStrength,
    liquidityScore,
    signal,
    strength
  };
}

// Get funding rates and liquidation data across exchanges
export async function getDerivativesData(symbol: string): Promise<{
  averageFundingRate: number;
  fundingDirection: 'positive' | 'negative' | 'neutral';
  openInterestChange24h: number; // percentage
  liquidations24h: number; // in USD millions
  longShortRatio: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
}> {
  console.log(`Getting derivatives data for ${symbol}`);
  
  // Generate realistic mock data
  const averageFundingRate = (Math.random() * 0.002 - 0.001); // -0.1% to 0.1%
  const openInterestChange24h = Math.random() * 10 - 5; // -5% to +5%
  const liquidations24h = Math.random() * 100; // 0-100 million USD
  const longShortRatio = Math.random() * 2 + 0.5; // 0.5 to 2.5
  
  let fundingDirection: 'positive' | 'negative' | 'neutral';
  if (averageFundingRate > 0.0001) {
    fundingDirection = 'positive';
  } else if (averageFundingRate < -0.0001) {
    fundingDirection = 'negative';
  } else {
    fundingDirection = 'neutral';
  }
  
  // Determine signal
  // Negative funding can be bullish (shorts paying longs)
  // High long/short ratio can be bearish (overcrowded longs)
  let signal: 'buy' | 'sell' | 'neutral';
  let signalComponents = 0;
  let signalStrength = 0;
  
  // Funding rate component
  if (fundingDirection === 'negative' && averageFundingRate < -0.0005) {
    signalComponents++;
    signalStrength += 40 + Math.min(60, Math.abs(averageFundingRate) * 60000); // Scale to 40-100
  } else if (fundingDirection === 'positive' && averageFundingRate > 0.0005) {
    signalComponents--;
    signalStrength += 40 + Math.min(60, Math.abs(averageFundingRate) * 60000);
  }
  
  // Long/short ratio component
  if (longShortRatio > 1.5) {
    signalComponents--; // Too many longs can be bearish (contrarian)
    signalStrength += 30 + Math.min(50, (longShortRatio - 1.5) * 50);
  } else if (longShortRatio < 0.7) {
    signalComponents++; // Too many shorts can be bullish (contrarian)
    signalStrength += 30 + Math.min(50, (0.7 - longShortRatio) * 50);
  }
  
  // Open interest change component
  if (Math.abs(openInterestChange24h) > 2) {
    if (openInterestChange24h > 0 && longShortRatio > 1.2) {
      signalComponents--; // Rising OI with more longs - potentially bearish
    } else if (openInterestChange24h > 0 && longShortRatio < 0.8) {
      signalComponents++; // Rising OI with more shorts - potentially bullish
    }
    signalStrength += 20 + Math.min(30, Math.abs(openInterestChange24h) * 5);
  }
  
  // Liquidations component (high liquidations can signal potential reversal)
  if (liquidations24h > 50) {
    // If massive long liquidations and negative funding
    if (longShortRatio < 1 && fundingDirection === 'negative') {
      signalComponents++; // Potential bottoming after long liquidation
    }
    // If massive short liquidations and positive funding
    else if (longShortRatio > 1 && fundingDirection === 'positive') {
      signalComponents--; // Potential topping after short liquidation
    }
    signalStrength += 20 + Math.min(30, (liquidations24h - 50) / 2);
  }
  
  // Determine final signal
  if (signalComponents > 0) {
    signal = 'buy';
  } else if (signalComponents < 0) {
    signal = 'sell';
  } else {
    signal = 'neutral';
    signalStrength = Math.min(signalStrength, 30); // Cap neutral signals at lower strength
  }
  
  // Normalize strength
  const strength = Math.min(100, signalStrength);
  
  return {
    averageFundingRate,
    fundingDirection,
    openInterestChange24h,
    liquidations24h,
    longShortRatio,
    signal,
    strength
  };
}

// Combined all-in-one function to get aggregated analysis
export async function getAggregatedAnalysis(symbol: string): Promise<{
  onChain: ReturnType<typeof getOnChainSignal>;
  orderBook: ReturnType<typeof getOrderBookAnalysis>;
  derivatives: ReturnType<typeof getDerivativesData>;
  combinedSignal: 'buy' | 'sell' | 'neutral';
  combinedStrength: number;
}> {
  console.log(`Getting aggregated on-chain analysis for ${symbol}`);
  
  // Parallel fetch all data sources
  const [onChainData, orderBookData, derivativesData] = await Promise.all([
    getOnChainSignal(symbol),
    getOrderBookAnalysis(symbol),
    getDerivativesData(symbol)
  ]);
  
  // Combine signals with appropriate weights
  const weights = {
    onChain: 0.5,      // On-chain data has highest weight
    orderBook: 0.3,    // Order book is important but more short-term
    derivatives: 0.2   // Derivatives data as supplementary signal
  };
  
  // Convert signals to numeric values: buy = 1, neutral = 0, sell = -1
  const signalValues = {
    onChain: onChainData.signal === 'buy' ? 1 : onChainData.signal === 'sell' ? -1 : 0,
    orderBook: orderBookData.signal === 'buy' ? 1 : orderBookData.signal === 'sell' ? -1 : 0,
    derivatives: derivativesData.signal === 'buy' ? 1 : derivativesData.signal === 'sell' ? -1 : 0
  };
  
  // Weighted average of signals
  const weightedSignalValue = (
    signalValues.onChain * weights.onChain +
    signalValues.orderBook * weights.orderBook +
    signalValues.derivatives * weights.derivatives
  );
  
  // Determine combined signal
  let combinedSignal: 'buy' | 'sell' | 'neutral';
  if (weightedSignalValue > 0.2) {
    combinedSignal = 'buy';
  } else if (weightedSignalValue < -0.2) {
    combinedSignal = 'sell';
  } else {
    combinedSignal = 'neutral';
  }
  
  // Calculate combined strength
  const combinedStrength = Math.min(100, (
    onChainData.strength * weights.onChain +
    orderBookData.strength * weights.orderBook +
    derivativesData.strength * weights.derivatives
  ) * (Math.abs(weightedSignalValue) * 1.5 + 0.5)); // Scale by signal agreement
  
  console.log(`Combined on-chain signal for ${symbol}: ${combinedSignal} with strength ${combinedStrength.toFixed(2)}`);
  
  return {
    onChain: onChainData,
    orderBook: orderBookData,
    derivatives: derivativesData,
    combinedSignal,
    combinedStrength
  };
}
