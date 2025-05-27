'use server';

import axios from 'axios';

type StablecoinMetrics = {
  timestamp: number;
  stablecoins: {
    name: string;
    symbol: string;
    marketCap: number;
    circulatingSupply: number;
    exchangeBalance: number;
    exchangeInflowLast24h: number;
    exchangeOutflowLast24h: number;
    netFlow24h: number;
    velocityLast24h: number; // Transaction volume / marketcap
    premium: number; // Deviation from peg (e.g., 1.002 = +0.2%)
  }[];
  aggregated: {
    totalMarketCap: number;
    totalExchangeBalance: number;
    totalNetFlow24h: number;
    totalVelocity24h: number;
    marketCapDominance: Record<string, number>; // % of total marketcap by stablecoin
  };
  bitcoinPriceUsd: number;
  marketCapRatio: number; // Total stablecoin marketcap / BTC marketcap
  trends: {
    supply30d: number; // % change in total supply over 30 days
    velocity30d: number; // % change in velocity over 30 days
    exchange30d: number; // % change in exchange balances over 30 days
  };
};

type StablecoinSignal = {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  reasoning: string;
  timeframe: 'short_term' | 'mid_term' | 'long_term';
};

// Get stablecoin metrics
export async function getStablecoinMetrics(): Promise<StablecoinMetrics> {
  console.log('Fetching stablecoin metrics');
  
  try {
    // In a real implementation, this would fetch from on-chain data providers
    // For this example, we'll generate realistic mock data
    
    // Generate USDT data
    const usdt = {
      name: 'Tether',
      symbol: 'USDT',
      marketCap: 82_500_000_000 + (Math.random() * 1_000_000_000),
      circulatingSupply: 82_500_000_000 + (Math.random() * 1_000_000_000),
      exchangeBalance: 41_000_000_000 + (Math.random() * 1_000_000_000),
      exchangeInflowLast24h: 2_000_000_000 + (Math.random() * 500_000_000),
      exchangeOutflowLast24h: 1_800_000_000 + (Math.random() * 500_000_000),
      netFlow24h: 0, // Calculated below
      velocityLast24h: 0.15 + (Math.random() * 0.05),
      premium: 0.9995 + (Math.random() * 0.002)
    };
    
    // Generate USDC data
    const usdc = {
      name: 'USD Coin',
      symbol: 'USDC',
      marketCap: 26_500_000_000 + (Math.random() * 500_000_000),
      circulatingSupply: 26_500_000_000 + (Math.random() * 500_000_000),
      exchangeBalance: 13_000_000_000 + (Math.random() * 500_000_000),
      exchangeInflowLast24h: 800_000_000 + (Math.random() * 200_000_000),
      exchangeOutflowLast24h: 850_000_000 + (Math.random() * 200_000_000),
      netFlow24h: 0, // Calculated below
      velocityLast24h: 0.12 + (Math.random() * 0.04),
      premium: 0.9997 + (Math.random() * 0.001)
    };
    
    // Generate BUSD data
    const busd = {
      name: 'Binance USD',
      symbol: 'BUSD',
      marketCap: 500_000_000 + (Math.random() * 100_000_000),
      circulatingSupply: 500_000_000 + (Math.random() * 100_000_000),
      exchangeBalance: 400_000_000 + (Math.random() * 50_000_000),
      exchangeInflowLast24h: 20_000_000 + (Math.random() * 10_000_000),
      exchangeOutflowLast24h: 25_000_000 + (Math.random() * 10_000_000),
      netFlow24h: 0, // Calculated below
      velocityLast24h: 0.1 + (Math.random() * 0.03),
      premium: 0.9998 + (Math.random() * 0.001)
    };
    
    // Generate DAI data
    const dai = {
      name: 'Dai',
      symbol: 'DAI',
      marketCap: 4_500_000_000 + (Math.random() * 100_000_000),
      circulatingSupply: 4_500_000_000 + (Math.random() * 100_000_000),
      exchangeBalance: 2_000_000_000 + (Math.random() * 100_000_000),
      exchangeInflowLast24h: 100_000_000 + (Math.random() * 50_000_000),
      exchangeOutflowLast24h: 95_000_000 + (Math.random() * 50_000_000),
      netFlow24h: 0, // Calculated below
      velocityLast24h: 0.08 + (Math.random() * 0.03),
      premium: 0.9996 + (Math.random() * 0.001)
    };
    
    // Calculate net flows
    usdt.netFlow24h = usdt.exchangeInflowLast24h - usdt.exchangeOutflowLast24h;
    usdc.netFlow24h = usdc.exchangeInflowLast24h - usdc.exchangeOutflowLast24h;
    busd.netFlow24h = busd.exchangeInflowLast24h - busd.exchangeOutflowLast24h;
    dai.netFlow24h = dai.exchangeInflowLast24h - dai.exchangeOutflowLast24h;
    
    // Combine stablecoins
    const stablecoins = [usdt, usdc, busd, dai];
    
    // Calculate aggregated metrics
    const totalMarketCap = stablecoins.reduce((sum, coin) => sum + coin.marketCap, 0);
    const totalExchangeBalance = stablecoins.reduce((sum, coin) => sum + coin.exchangeBalance, 0);
    const totalNetFlow24h = stablecoins.reduce((sum, coin) => sum + coin.netFlow24h, 0);
    const totalVelocity24h = stablecoins.reduce((sum, coin) => sum + (coin.velocityLast24h * coin.marketCap), 0) / totalMarketCap;
    
    // Calculate market cap dominance
    const marketCapDominance: Record<string, number> = {};
    stablecoins.forEach(coin => {
      marketCapDominance[coin.symbol] = (coin.marketCap / totalMarketCap) * 100;
    });
    
    // Estimate BTC price and market cap
    const bitcoinPriceUsd = 35000 + (Math.random() * 5000);
    const bitcoinMarketCap = bitcoinPriceUsd * 19500000; // Approximate circulating supply
    
    // Calculate market cap ratio
    const marketCapRatio = totalMarketCap / bitcoinMarketCap;
    
    // Generate trend data
    const trends = {
      supply30d: (Math.random() * 8) - 2, // -2% to +6% change
      velocity30d: (Math.random() * 20) - 5, // -5% to +15% change
      exchange30d: (Math.random() * 10) - 3 // -3% to +7% change
    };
    
    return {
      timestamp: Date.now(),
      stablecoins,
      aggregated: {
        totalMarketCap,
        totalExchangeBalance,
        totalNetFlow24h,
        totalVelocity24h,
        marketCapDominance
      },
      bitcoinPriceUsd,
      marketCapRatio,
      trends
    };
  } catch (error) {
    console.error('Error fetching stablecoin metrics:', error);
    throw error;
  }
}

// Generate signals based on stablecoin metrics
export async function getStablecoinSignals(): Promise<StablecoinSignal[]> {
  try {
    // Get stablecoin metrics
    const metrics = await getStablecoinMetrics();
    
    const signals: StablecoinSignal[] = [];
    
    // Signal 1: Exchange netflow signal (short-term)
    const netFlowSignal = generateNetFlowSignal(metrics);
    signals.push(netFlowSignal);
    
    // Signal 2: Supply growth signal (mid-term)
    const supplySignal = generateSupplySignal(metrics);
    signals.push(supplySignal);
    
    // Signal 3: Stablecoin/BTC ratio signal (long-term)
    const ratioSignal = generateRatioSignal(metrics);
    signals.push(ratioSignal);
    
    return signals;
  } catch (error) {
    console.error('Error generating stablecoin signals:', error);
    return [];
  }
}

// Generate signal based on exchange netflow
function generateNetFlowSignal(metrics: StablecoinMetrics): StablecoinSignal {
  const netFlow = metrics.aggregated.totalNetFlow24h;
  const netFlowPercent = (netFlow / metrics.aggregated.totalExchangeBalance) * 100;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  
  if (netFlowPercent < -2) {
    // Significant outflow from exchanges
    signal = 'buy';
    strength = Math.min(100, 60 + Math.abs(netFlowPercent) * 5);
    reasoning = `Strong buy signal: ${Math.abs(netFlowPercent).toFixed(2)}% net outflow from exchanges in last 24h (${(Math.abs(netFlow) / 1_000_000_000).toFixed(2)}B USD). Capital potentially positioning for buying opportunity.`;
  } else if (netFlowPercent > 2) {
    // Significant inflow to exchanges
    signal = 'sell';
    strength = Math.min(100, 60 + netFlowPercent * 5);
    reasoning = `Strong sell signal: ${netFlowPercent.toFixed(2)}% net inflow to exchanges in last 24h (${(netFlow / 1_000_000_000).toFixed(2)}B USD). Capital potentially positioning for selling.`;
  } else if (netFlowPercent < -0.5) {
    // Moderate outflow
    signal = 'buy';
    strength = 40 + Math.abs(netFlowPercent) * 10;
    reasoning = `Moderate buy signal: ${Math.abs(netFlowPercent).toFixed(2)}% net outflow from exchanges in last 24h (${(Math.abs(netFlow) / 1_000_000_000).toFixed(2)}B USD).`;
  } else if (netFlowPercent > 0.5) {
    // Moderate inflow
    signal = 'sell';
    strength = 40 + netFlowPercent * 10;
    reasoning = `Moderate sell signal: ${netFlowPercent.toFixed(2)}% net inflow to exchanges in last 24h (${(netFlow / 1_000_000_000).toFixed(2)}B USD).`;
  } else {
    // Balanced flow
    signal = 'neutral';
    strength = 20;
    reasoning = `Neutral signal: Balanced stablecoin flows between exchanges in last 24h (${(netFlow / 1_000_000_000).toFixed(2)}B USD net flow).`;
  }
  
  return {
    signal,
    strength,
    reasoning,
    timeframe: 'short_term'
  };
}

// Generate signal based on supply growth
function generateSupplySignal(metrics: StablecoinMetrics): StablecoinSignal {
  const supplyGrowth = metrics.trends.supply30d;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  
  if (supplyGrowth > 4) {
    // Strong supply growth
    signal = 'buy';
    strength = Math.min(100, 50 + supplyGrowth * 5);
    reasoning = `Bullish mid-term signal: ${supplyGrowth.toFixed(1)}% increase in stablecoin supply over 30 days. Indicates capital entering crypto markets, potentially preparing for allocation to crypto assets.`;
  } else if (supplyGrowth < -1) {
    // Supply contraction
    signal = 'sell';
    strength = Math.min(100, 50 + Math.abs(supplyGrowth) * 10);
    reasoning = `Bearish mid-term signal: ${Math.abs(supplyGrowth).toFixed(1)}% decrease in stablecoin supply over 30 days. Indicates capital leaving crypto markets.`;
  } else if (supplyGrowth > 1) {
    // Moderate supply growth
    signal = 'buy';
    strength = 40 + supplyGrowth * 5;
    reasoning = `Moderately bullish mid-term signal: ${supplyGrowth.toFixed(1)}% increase in stablecoin supply over 30 days.`;
  } else {
    // Stable supply
    signal = 'neutral';
    strength = 30;
    reasoning = `Neutral mid-term signal: Stable stablecoin supply (${supplyGrowth.toFixed(1)}% change) over 30 days.`;
  }
  
  return {
    signal,
    strength,
    reasoning,
    timeframe: 'mid_term'
  };
}

// Generate signal based on stablecoin/BTC market cap ratio
function generateRatioSignal(metrics: StablecoinMetrics): StablecoinSignal {
  const ratio = metrics.marketCapRatio;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  
  // Historical context: Ratio above 0.12 often indicates high buying power on sidelines
  if (ratio > 0.12) {
    signal = 'buy';
    strength = Math.min(100, 60 + (ratio - 0.12) * 200);
    reasoning = `Bullish long-term signal: Stablecoin market cap is ${(ratio * 100).toFixed(1)}% of Bitcoin's market cap, indicating significant capital ready to enter the market. Historically a strong bullish indicator.`;
  } else if (ratio < 0.06) {
    signal = 'sell';
    strength = Math.min(100, 60 + (0.06 - ratio) * 500);
    reasoning = `Bearish long-term signal: Stablecoin market cap is only ${(ratio * 100).toFixed(1)}% of Bitcoin's market cap, indicating low buying power on sidelines. Historically a sign of market exhaustion.`;
  } else if (ratio > 0.09) {
    signal = 'buy';
    strength = 40 + (ratio - 0.09) * 300;
    reasoning = `Moderately bullish long-term signal: Stablecoin market cap is ${(ratio * 100).toFixed(1)}% of Bitcoin's market cap, indicating healthy capital available on sidelines.`;
  } else {
    signal = 'neutral';
    strength = 30;
    reasoning = `Neutral long-term signal: Stablecoin market cap at ${(ratio * 100).toFixed(1)}% of Bitcoin's market cap, indicating balanced market conditions.`;
  }
  
  return {
    signal,
    strength,
    reasoning,
    timeframe: 'long_term'
  };
}

// Get combined stablecoin signal
export async function getCombinedStablecoinSignal(): Promise<{
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  shortTermSignal: StablecoinSignal;
  midTermSignal: StablecoinSignal;
  longTermSignal: StablecoinSignal;
  combinedReasoning: string;
}> {
  try {
    const signals = await getStablecoinSignals();
    
    if (signals.length === 0) {
      throw new Error('No signals generated');
    }
    
    // Separate signals by timeframe
    const shortTermSignal = signals.find(s => s.timeframe === 'short_term') || signals[0];
    const midTermSignal = signals.find(s => s.timeframe === 'mid_term') || signals[0];
    const longTermSignal = signals.find(s => s.timeframe === 'long_term') || signals[0];
    
    // Weight the signals (short-term: 20%, mid-term: 30%, long-term: 50%)
    const shortTermWeight = 0.2;
    const midTermWeight = 0.3;
    const longTermWeight = 0.5;
    
    // Convert signals to numeric values
    const shortTermValue = shortTermSignal.signal === 'buy' ? 1 : shortTermSignal.signal === 'sell' ? -1 : 0;
    const midTermValue = midTermSignal.signal === 'buy' ? 1 : midTermSignal.signal === 'sell' ? -1 : 0;
    const longTermValue = longTermSignal.signal === 'buy' ? 1 : longTermSignal.signal === 'sell' ? -1 : 0;
    
    // Calculate weighted average
    const weightedValue = (
      shortTermValue * shortTermWeight * (shortTermSignal.strength / 100) +
      midTermValue * midTermWeight * (midTermSignal.strength / 100) +
      longTermValue * longTermWeight * (longTermSignal.strength / 100)
    );
    
    // Determine combined signal
    let signal: 'buy' | 'sell' | 'neutral';
    if (weightedValue > 0.2) {
      signal = 'buy';
    } else if (weightedValue < -0.2) {
      signal = 'sell';
    } else {
      signal = 'neutral';
    }
    
    // Calculate combined strength
    const strength = Math.min(100, Math.abs(weightedValue) * 100);
    
    // Generate combined reasoning
    const combinedReasoning = `Stablecoin analysis shows: ${shortTermSignal.reasoning} ${midTermSignal.reasoning} ${longTermSignal.reasoning}`;
    
    return {
      signal,
      strength,
      shortTermSignal,
      midTermSignal,
      longTermSignal,
      combinedReasoning
    };
  } catch (error) {
    console.error('Error generating combined stablecoin signal:', error);
    // Return a default neutral signal
    const defaultSignal: StablecoinSignal = {
      signal: 'neutral',
      strength: 0,
      reasoning: 'Error analyzing stablecoin metrics.',
      timeframe: 'short_term'
    };
    
    return {
      signal: 'neutral',
      strength: 0,
      shortTermSignal: defaultSignal,
      midTermSignal: defaultSignal,
      longTermSignal: defaultSignal,
      combinedReasoning: 'Error analyzing stablecoin metrics.'
    };
  }
}