'use server';

import axios from 'axios';

type Exchange = 'Binance' | 'Bybit' | 'OKX' | 'dYdX' | 'BitMEX' | 'FTX' | 'Deribit';

type FundingRateData = {
  exchange: Exchange;
  symbol: string;
  rate: number; // Funding rate as decimal (e.g., 0.001 = 0.1%)
  timestamp: number;
  annualized: number; // Annualized funding rate
};

type OpenInterestData = {
  exchange: Exchange;
  symbol: string;
  openInterest: number; // In USD
  openInterestCoin: number; // In coin amount
  timestamp: number;
  change24h: number; // Percentage change in last 24h
};

type LiquidationData = {
  exchange: Exchange;
  symbol: string;
  amount: number; // In USD
  side: 'long' | 'short';
  timestamp: number;
};

type DerivsMarketData = {
  timestamp: number;
  symbol: string;
  fundingRates: {
    current: FundingRateData[];
    average: number;
    weightedAverage: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    historicalRates: { timestamp: number; average: number }[];
  };
  openInterest: {
    total: number; // Total OI in USD
    byExchange: OpenInterestData[];
    change24h: number; // Percentage change in last 24h
    trend: 'increasing' | 'decreasing' | 'stable';
    historicalOI: { timestamp: number; total: number }[];
  };
  liquidations: {
    last24h: {
      total: number; // Total liquidations in USD
      longs: number; // Long liquidations in USD
      shorts: number; // Short liquidations in USD
    };
    recentEvents: LiquidationData[];
    historicalLiquidations: { timestamp: number; longs: number; shorts: number }[];
  };
  longShortRatio: number; // Ratio of long positions to short positions
  basis: { // Futures basis (premium/discount to spot)
    current: number; // Current basis percentage
    trend: 'widening' | 'narrowing' | 'stable';
    historicalBasis: { timestamp: number; basis: number }[];
  };
};

type DerivativeSignal = {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  timeframe: 'immediate' | 'short_term' | 'mid_term';
  reasoning: string;
  confidence: number; // 0-100
};

// Get derivatives market data for a symbol
export async function getDerivativesData(symbol: string): Promise<DerivsMarketData> {
  console.log(`Fetching derivatives data for ${symbol}`);
  
  try {
    // In a real implementation, this would fetch from various exchange APIs
    // For this example, we'll generate realistic mock data
    
    // Generate funding rate data
    const exchanges: Exchange[] = ['Binance', 'Bybit', 'OKX', 'dYdX', 'BitMEX', 'Deribit'];
    const fundingRates: FundingRateData[] = exchanges.map(exchange => {
      // Generate realistic funding rates
      // Typically ranges from -0.1% to 0.1% (8-hour on most exchanges)
      // Negative funding rates often occur in bearish markets
      const baseRate = (Math.random() * 0.002) - 0.001; // -0.1% to 0.1%
      
      return {
        exchange,
        symbol,
        rate: baseRate,
        timestamp: Date.now() - Math.floor(Math.random() * 3600000), // Within last hour
        annualized: baseRate * 3 * 365 // Convert to annualized rate (assuming 8-hour periods)
      };
    });
    
    // Calculate average funding rate
    const avgFundingRate = fundingRates.reduce((sum, item) => sum + item.rate, 0) / fundingRates.length;
    
    // Calculate weighted average (weight by exchange importance)
    const exchangeWeights: Record<Exchange, number> = {
      'Binance': 0.3,
      'Bybit': 0.2,
      'OKX': 0.15,
      'dYdX': 0.15,
      'BitMEX': 0.1,
      'Deribit': 0.1,
      'FTX': 0 // Defunct
    };
    
    const weightedAvgFundingRate = fundingRates.reduce(
      (sum, item) => sum + (item.rate * (exchangeWeights[item.exchange] || 0)), 
      0
    ) / fundingRates.reduce((sum, item) => sum + (exchangeWeights[item.exchange] || 0), 0);
    
    // Generate historical funding rates for trend analysis
    const now = Date.now();
    const hoursBack = 48; // 2 days of history
    const historicalRates = Array(hoursBack).fill(0).map((_, i) => {
      // Create slightly varying rates with a trend
      const timeOffset = hoursBack - i;
      const trendFactor = timeOffset / hoursBack; // 1 to 0 as we approach current time
      
      // Add trend bias
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      const trendMagnitude = Math.random() * 0.0005; // Max 0.05% change due to trend
      
      const historicalRate = avgFundingRate * (1 + (trendDirection * trendMagnitude * trendFactor)) + 
                            ((Math.random() - 0.5) * 0.0004); // Add some randomness
      
      return {
        timestamp: now - (timeOffset * 3600000),
        average: historicalRate
      };
    });
    
    // Determine funding rate trend
    const recentRates = historicalRates.slice(-6); // Last 6 hours
    const oldRates = historicalRates.slice(-12, -6); // 6 hours before that
    
    const recentAvg = recentRates.reduce((sum, item) => sum + item.average, 0) / recentRates.length;
    const oldAvg = oldRates.reduce((sum, item) => sum + item.average, 0) / oldRates.length;
    
    const rateTrend = recentAvg > oldAvg * 1.1 ? 'increasing' : 
                     recentAvg < oldAvg * 0.9 ? 'decreasing' : 'stable';
    
    // Generate open interest data
    const baseOI = symbol.includes('BTC') ? 10_000_000_000 : // $10B for BTC
                  symbol.includes('ETH') ? 5_000_000_000 : // $5B for ETH
                  symbol.includes('SOL') ? 1_000_000_000 : // $1B for SOL
                  500_000_000; // $500M for other alts
    
    const openInterestData: OpenInterestData[] = exchanges.map(exchange => {
      // Distribute OI across exchanges with some randomness
      const exchangeOIShare = exchangeWeights[exchange] + (Math.random() * 0.1) - 0.05;
      const exchangeOI = baseOI * exchangeOIShare;
      
      // Current price for coin amount calculation
      const coinPrice = symbol.includes('BTC') ? 35000 + (Math.random() * 5000) :
                       symbol.includes('ETH') ? 1800 + (Math.random() * 300) :
                       symbol.includes('SOL') ? 40 + (Math.random() * 10) : 1;
      
      return {
        exchange,
        symbol,
        openInterest: exchangeOI,
        openInterestCoin: exchangeOI / coinPrice,
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        change24h: (Math.random() * 10) - 5 // -5% to +5% change
      };
    });
    
    const totalOI = openInterestData.reduce((sum, item) => sum + item.openInterest, 0);
    const oiChange24h = openInterestData.reduce(
      (sum, item) => sum + (item.change24h * (item.openInterest / totalOI)), 
      0
    ); // Weighted average change
    
    // Generate historical OI data
    const historicalOI = Array(hoursBack).fill(0).map((_, i) => {
      const timeOffset = hoursBack - i;
      const trendFactor = timeOffset / hoursBack;
      
      // Create a trend in OI
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      const trendMagnitude = Math.random() * 0.1; // Max 10% change due to trend
      
      const historicalOIValue = totalOI * (1 + (trendDirection * trendMagnitude * trendFactor)) + 
                               ((Math.random() - 0.5) * totalOI * 0.02); // Add some randomness
      
      return {
        timestamp: now - (timeOffset * 3600000),
        total: historicalOIValue
      };
    });
    
    // Determine OI trend
    const recentOI = historicalOI.slice(-6); // Last 6 hours
    const oldOI = historicalOI.slice(-12, -6); // 6 hours before that
    
    const recentOIAvg = recentOI.reduce((sum, item) => sum + item.total, 0) / recentOI.length;
    const oldOIAvg = oldOI.reduce((sum, item) => sum + item.total, 0) / oldOI.length;
    
    const oiTrend = recentOIAvg > oldOIAvg * 1.02 ? 'increasing' : 
                   recentOIAvg < oldOIAvg * 0.98 ? 'decreasing' : 'stable';
    
    // Generate liquidation data
    const longLiquidations = Math.random() * totalOI * 0.01; // 0-1% of total OI
    const shortLiquidations = Math.random() * totalOI * 0.01; // 0-1% of total OI
    
    // Recent liquidation events
    const recentLiquidations: LiquidationData[] = [];
    const liquidationEventCount = Math.floor(Math.random() * 5) + 1; // 1-5 events
    
    for (let i = 0; i < liquidationEventCount; i++) {
      const isLong = Math.random() > 0.5;
      const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
      const amount = isLong ? 
                   (longLiquidations / liquidationEventCount) * (0.5 + Math.random()) :
                   (shortLiquidations / liquidationEventCount) * (0.5 + Math.random());
      
      recentLiquidations.push({
        exchange,
        symbol,
        amount,
        side: isLong ? 'long' : 'short',
        timestamp: now - Math.floor(Math.random() * 86400000) // Within last 24h
      });
    }
    
    // Historical liquidations
    const historicalLiquidations = Array(hoursBack).fill(0).map((_, i) => {
      const timeOffset = hoursBack - i;
      
      // Create realistic liquidation patterns
      const baseHourlyLiq = totalOI * 0.001; // Base 0.1% liquidation per hour
      const randomFactor = Math.random() * 3; // 0-3x multiplier for spikes
      
      // Long/short distribution - let's make it somewhat related to funding rates
      // Negative funding often correlates with more long liquidations
      const longRatio = avgFundingRate < 0 ? 0.6 + (Math.random() * 0.3) : 0.3 + (Math.random() * 0.3);
      
      return {
        timestamp: now - (timeOffset * 3600000),
        longs: baseHourlyLiq * randomFactor * longRatio,
        shorts: baseHourlyLiq * randomFactor * (1 - longRatio)
      };
    });
    
    // Calculate long/short ratio
    // This is often influenced by funding rates and market sentiment
    // Negative funding often means more shorts than longs
    const longShortRatioBase = avgFundingRate < 0 ? 0.8 + (Math.random() * 0.4) : 1.2 + (Math.random() * 0.6);
    
    // Generate futures basis data
    // The premium of futures over spot, typically positive in bull markets
    const baseAnnualBasis = 0.05 + (Math.random() * 0.1) * (avgFundingRate < 0 ? 0.5 : 1.5); // 5-15% annually, lower in bear markets
    const currentBasis = baseAnnualBasis / 365 * 30; // Convert to 30-day basis
    
    // Historical basis
    const historicalBasis = Array(hoursBack).fill(0).map((_, i) => {
      const timeOffset = hoursBack - i;
      const trendFactor = timeOffset / hoursBack;
      
      // Create a trend in basis
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      const trendMagnitude = Math.random() * 0.01; // Max 1% change due to trend
      
      const historicalBasisValue = currentBasis * (1 + (trendDirection * trendMagnitude * trendFactor)) + 
                                 ((Math.random() - 0.5) * 0.002); // Add some randomness
      
      return {
        timestamp: now - (timeOffset * 3600000),
        basis: historicalBasisValue
      };
    });
    
    // Determine basis trend
    const recentBasis = historicalBasis.slice(-6);
    const oldBasis = historicalBasis.slice(-12, -6);
    
    const recentBasisAvg = recentBasis.reduce((sum, item) => sum + item.basis, 0) / recentBasis.length;
    const oldBasisAvg = oldBasis.reduce((sum, item) => sum + item.basis, 0) / oldBasis.length;
    
    const basisTrend = recentBasisAvg > oldBasisAvg * 1.1 ? 'widening' : 
                      recentBasisAvg < oldBasisAvg * 0.9 ? 'narrowing' : 'stable';
    
    return {
      timestamp: now,
      symbol,
      fundingRates: {
        current: fundingRates,
        average: avgFundingRate,
        weightedAverage: weightedAvgFundingRate,
        trend: rateTrend,
        historicalRates
      },
      openInterest: {
        total: totalOI,
        byExchange: openInterestData,
        change24h: oiChange24h,
        trend: oiTrend,
        historicalOI
      },
      liquidations: {
        last24h: {
          total: longLiquidations + shortLiquidations,
          longs: longLiquidations,
          shorts: shortLiquidations
        },
        recentEvents: recentLiquidations,
        historicalLiquidations
      },
      longShortRatio: longShortRatioBase,
      basis: {
        current: currentBasis,
        trend: basisTrend,
        historicalBasis
      }
    };
  } catch (error) {
    console.error('Error fetching derivatives data:', error);
    throw error;
  }
}

// Generate trading signals based on derivatives data
export async function getDerivativesSignals(symbol: string): Promise<DerivativeSignal[]> {
  try {
    // Get derivatives data
    const derivsData = await getDerivativesData(symbol);
    
    // Generate signals for different aspects of derivatives markets
    const signals: DerivativeSignal[] = [];
    
    // 1. Funding rate signal (short-term market sentiment)
    signals.push(generateFundingRateSignal(derivsData));
    
    // 2. Open interest signal (mid-term market momentum)
    signals.push(generateOpenInterestSignal(derivsData));
    
    // 3. Liquidation cascade signal (immediate market reaction)
    signals.push(generateLiquidationSignal(derivsData));
    
    // 4. Long/short ratio signal (short-term market positioning)
    signals.push(generateLongShortRatioSignal(derivsData));
    
    // 5. Basis signal (mid-term market expectations)
    signals.push(generateBasisSignal(derivsData));
    
    return signals;
  } catch (error) {
    console.error('Error generating derivatives signals:', error);
    return [];
  }
}

// Generate signal based on funding rates
function generateFundingRateSignal(data: DerivsMarketData): DerivativeSignal {
  const fundingRate = data.fundingRates.weightedAverage;
  const annualizedRate = fundingRate * 3 * 365; // Convert to annualized (assuming 8h periods)
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  let confidence: number;
  
  // Analyze funding rate
  // Negative funding rate often considered bullish (shorts paying longs)
  // Positive funding rate often considered bearish (longs paying shorts)
  if (fundingRate < -0.0005) { // Less than -0.05% (8h)
    signal = 'buy';
    strength = Math.min(100, 60 + Math.abs(fundingRate) * 20000); // Scale up to 100
    reasoning = `Bullish signal: Negative funding rate (${(fundingRate * 100).toFixed(4)}%, annualized ${(annualizedRate * 100).toFixed(2)}%) indicates shorts paying longs. Often a contrarian buy signal.`;
    confidence = 70 + Math.min(20, Math.abs(fundingRate) * 10000);
  } else if (fundingRate > 0.0007) { // Greater than 0.07% (8h)
    signal = 'sell';
    strength = Math.min(100, 60 + fundingRate * 15000); // Scale up to 100
    reasoning = `Bearish signal: High positive funding rate (${(fundingRate * 100).toFixed(4)}%, annualized ${(annualizedRate * 100).toFixed(2)}%) indicates longs paying shorts. Often signals market euphoria and potential reversal.`;
    confidence = 70 + Math.min(20, fundingRate * 8000);
  } else if (fundingRate < -0.0002) { // Between -0.02% and -0.05%
    signal = 'buy';
    strength = 40 + Math.abs(fundingRate) * 10000;
    reasoning = `Mildly bullish signal: Slightly negative funding rate (${(fundingRate * 100).toFixed(4)}%, annualized ${(annualizedRate * 100).toFixed(2)}%) indicates shorts paying longs.`;
    confidence = 60 + Math.abs(fundingRate) * 5000;
  } else if (fundingRate > 0.0003) { // Between 0.03% and 0.07%
    signal = 'sell';
    strength = 40 + fundingRate * 8000;
    reasoning = `Mildly bearish signal: Slightly positive funding rate (${(fundingRate * 100).toFixed(4)}%, annualized ${(annualizedRate * 100).toFixed(2)}%) indicates longs paying shorts.`;
    confidence = 60 + fundingRate * 4000;
  } else {
    signal = 'neutral';
    strength = 20;
    reasoning = `Neutral signal: Funding rate near zero (${(fundingRate * 100).toFixed(4)}%, annualized ${(annualizedRate * 100).toFixed(2)}%) indicates balanced market sentiment.`;
    confidence = 60;
  }
  
  // Modify signal based on trend
  if (data.fundingRates.trend === 'increasing' && fundingRate > 0) {
    strength = Math.min(100, strength * 1.2);
    reasoning += ` Funding rates are increasing, which strengthens the bearish signal.`;
  } else if (data.fundingRates.trend === 'decreasing' && fundingRate < 0) {
    strength = Math.min(100, strength * 1.2);
    reasoning += ` Funding rates are becoming more negative, which strengthens the bullish signal.`;
  } else if (data.fundingRates.trend === 'decreasing' && fundingRate > 0) {
    strength = Math.max(20, strength * 0.8);
    reasoning += ` However, funding rates are decreasing, which weakens the bearish signal.`;
  } else if (data.fundingRates.trend === 'increasing' && fundingRate < 0) {
    strength = Math.max(20, strength * 0.8);
    reasoning += ` However, funding rates are becoming less negative, which weakens the bullish signal.`;
  }
  
  return {
    signal,
    strength,
    timeframe: 'short_term',
    reasoning,
    confidence
  };
}

// Generate signal based on open interest
function generateOpenInterestSignal(data: DerivsMarketData): DerivativeSignal {
  const oiChange = data.openInterest.change24h;
  const oiTrend = data.openInterest.trend;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  let confidence: number;
  
  // Analyze open interest
  // Rapidly increasing OI often indicates new money entering the market
  // Rapidly decreasing OI often indicates positions being closed
  if (oiChange > 5 && oiTrend === 'increasing') {
    // Strong increase in open interest
    signal = 'buy'; // Generally bullish for continuation of trend
    strength = Math.min(100, 60 + oiChange * 3);
    reasoning = `Bullish momentum signal: Open interest increased by ${oiChange.toFixed(2)}% in 24h and continues to rise. Indicates increasing market participation and new money entering.`;
    confidence = 70 + Math.min(20, oiChange);
  } else if (oiChange < -5 && oiTrend === 'decreasing') {
    // Strong decrease in open interest
    signal = 'sell'; // Generally bearish for continuation
    strength = Math.min(100, 60 + Math.abs(oiChange) * 3);
    reasoning = `Bearish momentum signal: Open interest decreased by ${Math.abs(oiChange).toFixed(2)}% in 24h and continues to fall. Indicates positions being closed and money leaving the market.`;
    confidence = 70 + Math.min(20, Math.abs(oiChange));
  } else if (oiChange > 2) {
    // Moderate increase in open interest
    signal = 'buy';
    strength = 40 + oiChange * 2;
    reasoning = `Mildly bullish signal: Open interest increased by ${oiChange.toFixed(2)}% in 24h. Indicates moderate increase in market participation.`;
    confidence = 60 + Math.min(10, oiChange);
  } else if (oiChange < -2) {
    // Moderate decrease in open interest
    signal = 'sell';
    strength = 40 + Math.abs(oiChange) * 2;
    reasoning = `Mildly bearish signal: Open interest decreased by ${Math.abs(oiChange).toFixed(2)}% in 24h. Indicates moderate position closures.`;
    confidence = 60 + Math.min(10, Math.abs(oiChange));
  } else {
    // Stable open interest
    signal = 'neutral';
    strength = 20;
    reasoning = `Neutral signal: Open interest stable (${oiChange.toFixed(2)}% change in 24h). Indicates balanced market activity.`;
    confidence = 60;
  }
  
  // Consider funding rate direction for context
  const fundingRate = data.fundingRates.weightedAverage;
  if (signal === 'buy' && fundingRate > 0.0005) {
    // OI increasing but funding is high positive - potential blow-off top
    strength = Math.max(20, strength * 0.7);
    reasoning += ` However, high positive funding rate (${(fundingRate * 100).toFixed(4)}%) suggests potential market euphoria. Be cautious.`;
    confidence = Math.max(50, confidence * 0.8);
    
    // If very high funding and OI, this could be a sell signal
    if (fundingRate > 0.001 && oiChange > 10) {
      signal = 'sell';
      strength = 70;
      reasoning = `Bearish reversal signal: Very high funding rate (${(fundingRate * 100).toFixed(4)}%) combined with rapidly increasing open interest (${oiChange.toFixed(2)}%) often precedes market tops.`;
      confidence = 75;
    }
  } else if (signal === 'sell' && fundingRate < -0.0005) {
    // OI decreasing but funding is strong negative - potential capitulation
    strength = Math.max(20, strength * 0.7);
    reasoning += ` However, strong negative funding rate (${(fundingRate * 100).toFixed(4)}%) suggests potential capitulation. Be cautious.`;
    confidence = Math.max(50, confidence * 0.8);
    
    // If very negative funding and OI dropping fast, this could be a buy signal
    if (fundingRate < -0.001 && oiChange < -10) {
      signal = 'buy';
      strength = 70;
      reasoning = `Bullish reversal signal: Very negative funding rate (${(fundingRate * 100).toFixed(4)}%) combined with rapidly decreasing open interest (${oiChange.toFixed(2)}%) often indicates capitulation.`;
      confidence = 75;
    }
  }
  
  return {
    signal,
    strength,
    timeframe: 'mid_term',
    reasoning,
    confidence
  };
}

// Generate signal based on liquidations
function generateLiquidationSignal(data: DerivsMarketData): DerivativeSignal {
  const totalLiquidations = data.liquidations.last24h.total;
  const longLiquidations = data.liquidations.last24h.longs;
  const shortLiquidations = data.liquidations.last24h.shorts;
  
  // Calculate liquidations as percentage of total OI
  const liquidationPercentage = (totalLiquidations / data.openInterest.total) * 100;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  let confidence: number;
  
  // Major liquidation events often represent capitulation
  // They can be contrarian signals (buy after long liquidations, sell after short liquidations)
  if (liquidationPercentage > 5) {
    // Major liquidation event (>5% of OI)
    if (longLiquidations > shortLiquidations * 2) {
      // Primarily long liquidations - often a buy signal after the dust settles
      signal = 'buy';
      strength = Math.min(100, 70 + liquidationPercentage * 2);
      reasoning = `Strong contrarian buy signal: Major long liquidation event (${(longLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI). Potential capitulation and buying opportunity.`;
      confidence = 80;
    } else if (shortLiquidations > longLiquidations * 2) {
      // Primarily short liquidations - often a sell signal after the squeeze
      signal = 'sell';
      strength = Math.min(100, 70 + liquidationPercentage * 2);
      reasoning = `Strong contrarian sell signal: Major short liquidation event (${(shortLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI). Potential short squeeze exhaustion.`;
      confidence = 80;
    } else {
      // Mixed liquidations - market indecision
      signal = 'neutral';
      strength = 40;
      reasoning = `Neutral signal with caution: Major mixed liquidation event (${(totalLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI). Market direction unclear after volatility.`;
      confidence = 60;
    }
  } else if (liquidationPercentage > 2) {
    // Moderate liquidation event (2-5% of OI)
    if (longLiquidations > shortLiquidations * 1.5) {
      signal = 'buy';
      strength = 50 + liquidationPercentage * 3;
      reasoning = `Moderate contrarian buy signal: Long liquidation event (${(longLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI). Potential local bottom.`;
      confidence = 70;
    } else if (shortLiquidations > longLiquidations * 1.5) {
      signal = 'sell';
      strength = 50 + liquidationPercentage * 3;
      reasoning = `Moderate contrarian sell signal: Short liquidation event (${(shortLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI). Potential local top.`;
      confidence = 70;
    } else {
      signal = 'neutral';
      strength = 30;
      reasoning = `Neutral signal: Moderate mixed liquidation event (${(totalLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI).`;
      confidence = 60;
    }
  } else {
    // Minor liquidation event (<2% of OI)
    signal = 'neutral';
    strength = 20;
    reasoning = `Neutral signal: Low liquidation activity (${(totalLiquidations / 1000000).toFixed(2)}M USD, ${liquidationPercentage.toFixed(2)}% of OI).`;
    confidence = 60;
  }
  
  return {
    signal,
    strength,
    timeframe: 'immediate',
    reasoning,
    confidence
  };
}

// Generate signal based on long/short ratio
function generateLongShortRatioSignal(data: DerivsMarketData): DerivativeSignal {
  const ratio = data.longShortRatio;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  let confidence: number;
  
  // Analyze long/short ratio
  // Extreme values can be contrarian signals
  // Values near 1 indicate balanced positioning
  if (ratio > 2.0) {
    // Extremely long-biased market
    signal = 'sell'; // Contrarian signal
    strength = Math.min(100, 60 + (ratio - 2) * 20);
    reasoning = `Contrarian sell signal: Very high long/short ratio (${ratio.toFixed(2)}). Market is heavily long-biased, which often precedes corrections.`;
    confidence = 70 + Math.min(20, (ratio - 2) * 10);
  } else if (ratio < 0.5) {
    // Extremely short-biased market
    signal = 'buy'; // Contrarian signal
    strength = Math.min(100, 60 + ((1/ratio) - 2) * 20);
    reasoning = `Contrarian buy signal: Very low long/short ratio (${ratio.toFixed(2)}). Market is heavily short-biased, which often precedes rallies.`;
    confidence = 70 + Math.min(20, ((1/ratio) - 2) * 10);
  } else if (ratio > 1.5) {
    // Moderately long-biased market
    signal = 'sell';
    strength = 40 + (ratio - 1.5) * 40;
    reasoning = `Mild contrarian sell signal: Elevated long/short ratio (${ratio.toFixed(2)}). Market is moderately long-biased.`;
    confidence = 60 + Math.min(10, (ratio - 1.5) * 20);
  } else if (ratio < 0.67) {
    // Moderately short-biased market
    signal = 'buy';
    strength = 40 + ((1/ratio) - 1.5) * 40;
    reasoning = `Mild contrarian buy signal: Low long/short ratio (${ratio.toFixed(2)}). Market is moderately short-biased.`;
    confidence = 60 + Math.min(10, ((1/ratio) - 1.5) * 20);
  } else {
    // Balanced market
    signal = 'neutral';
    strength = 20;
    reasoning = `Neutral signal: Balanced long/short ratio (${ratio.toFixed(2)}). Market participants are not significantly biased in either direction.`;
    confidence = 70;
  }
  
  // Consider funding rate direction for context
  const fundingRate = data.fundingRates.weightedAverage;
  
  // If long/short ratio and funding rate align, it strengthens the signal
  if ((ratio > 1.2 && fundingRate > 0.0003) || (ratio < 0.8 && fundingRate < -0.0003)) {
    strength = Math.min(100, strength * 1.2);
    confidence = Math.min(100, confidence * 1.1);
    reasoning += ` This signal is strengthened by aligned funding rate (${(fundingRate * 100).toFixed(4)}%).`;
  }
  
  return {
    signal,
    strength,
    timeframe: 'short_term',
    reasoning,
    confidence
  };
}

// Generate signal based on futures basis
function generateBasisSignal(data: DerivsMarketData): DerivativeSignal {
  const basis = data.basis.current;
  const basisAnnualized = basis * 365 / 30; // Convert from 30-day to annual
  const basisTrend = data.basis.trend;
  
  let signal: 'buy' | 'sell' | 'neutral';
  let strength: number;
  let reasoning: string;
  let confidence: number;
  
  // Analyze basis
  // High basis indicates bullish sentiment, but extremely high basis can be a contrarian sell signal
  // Negative basis indicates bearish sentiment, but can be a contrarian buy signal
  if (basis > 0.01) { // More than 1% for 30-day contracts
    if (basis > 0.03) { // More than 3% for 30-day (very high)
      // Extremely high basis
      signal = 'sell'; // Contrarian signal
      strength = Math.min(100, 60 + (basis - 0.03) * 1000);
      reasoning = `Contrarian sell signal: Very high futures basis (${(basis * 100).toFixed(2)}% for 30-day, ${(basisAnnualized * 100).toFixed(2)}% annualized). Indicates excessive bullish sentiment.`;
      confidence = 70 + Math.min(20, (basis - 0.03) * 500);
    } else {
      // Moderately high basis
      signal = 'buy'; // Trend continuation signal
      strength = 40 + (basis - 0.01) * 1000;
      reasoning = `Bullish signal: Healthy futures basis (${(basis * 100).toFixed(2)}% for 30-day, ${(basisAnnualized * 100).toFixed(2)}% annualized). Indicates positive market sentiment.`;
      confidence = 60 + Math.min(20, (basis - 0.01) * 500);
    }
  } else if (basis < 0) { // Negative basis (backwardation)
    if (basis < -0.01) { // Less than -1% for 30-day (very negative)
      // Extremely negative basis
      signal = 'buy'; // Contrarian signal
      strength = Math.min(100, 60 + Math.abs(basis) * 1000);
      reasoning = `Contrarian buy signal: Negative futures basis (${(basis * 100).toFixed(2)}% for 30-day, ${(basisAnnualized * 100).toFixed(2)}% annualized). Indicates excessive bearish sentiment or market stress.`;
      confidence = 70 + Math.min(20, Math.abs(basis) * 500);
    } else {
      // Slightly negative basis
      signal = 'sell'; // Trend continuation signal
      strength = 40 + Math.abs(basis) * 1000;
      reasoning = `Bearish signal: Negative futures basis (${(basis * 100).toFixed(2)}% for 30-day, ${(basisAnnualized * 100).toFixed(2)}% annualized). Indicates negative market sentiment.`;
      confidence = 60 + Math.min(20, Math.abs(basis) * 500);
    }
  } else { // 0% to 1% basis
    // Normal basis range
    signal = 'neutral';
    strength = 20 + basis * 2000;
    reasoning = `Neutral to mildly bullish signal: Normal futures basis (${(basis * 100).toFixed(2)}% for 30-day, ${(basisAnnualized * 100).toFixed(2)}% annualized). Indicates balanced market conditions.`;
    confidence = 70;
  }
  
  // Modify signal based on basis trend
  if (basisTrend === 'widening' && basis > 0) {
    strength = Math.min(100, strength * 1.2);
    reasoning += ` Basis is widening, which strengthens the signal.`;
    confidence = Math.min(100, confidence * 1.1);
  } else if (basisTrend === 'narrowing' && basis > 0) {
    strength = Math.max(20, strength * 0.8);
    reasoning += ` However, basis is narrowing, which weakens the signal.`;
    confidence = Math.max(50, confidence * 0.9);
  } else if (basisTrend === 'widening' && basis < 0) {
    strength = Math.min(100, strength * 1.2);
    reasoning += ` Basis is becoming more negative, which strengthens the signal.`;
    confidence = Math.min(100, confidence * 1.1);
  } else if (basisTrend === 'narrowing' && basis < 0) {
    strength = Math.max(20, strength * 0.8);
    reasoning += ` However, basis is becoming less negative, which weakens the signal.`;
    confidence = Math.max(50, confidence * 0.9);
  }
  
  return {
    signal,
    strength,
    timeframe: 'mid_term',
    reasoning,
    confidence
  };
}

// Get combined derivatives market signal
export async function getCombinedDerivativesSignal(symbol: string): Promise<{
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  reasoning: string;
  confidence: number;
  signals: DerivativeSignal[];
}> {
  try {
    const signals = await getDerivativesSignals(symbol);
    
    if (signals.length === 0) {
      throw new Error('No signals generated');
    }
    
    // Weight the signals based on timeframe and confidence
    const weights: Record<string, number> = {
      'immediate': 0.15,
      'short_term': 0.35,
      'mid_term': 0.5
    };
    
    let weightedBuySignal = 0;
    let weightedSellSignal = 0;
    let totalWeight = 0;
    
    // Calculate weighted signals
    signals.forEach(signal => {
      const weight = weights[signal.timeframe] * (signal.confidence / 100);
      totalWeight += weight;
      
      if (signal.signal === 'buy') {
        weightedBuySignal += weight * (signal.strength / 100);
      } else if (signal.signal === 'sell') {
        weightedSellSignal += weight * (signal.strength / 100);
      }
    });
    
    // Normalize weights
    if (totalWeight > 0) {
      weightedBuySignal = weightedBuySignal / totalWeight;
      weightedSellSignal = weightedSellSignal / totalWeight;
    }
    
    // Determine overall signal
    let signal: 'buy' | 'sell' | 'neutral';
    let strength: number;
    let confidence: number;
    
    if (weightedBuySignal > weightedSellSignal + 0.2) {
      signal = 'buy';
      strength = weightedBuySignal * 100;
      confidence = 60 + (weightedBuySignal - weightedSellSignal) * 40;
    } else if (weightedSellSignal > weightedBuySignal + 0.2) {
      signal = 'sell';
      strength = weightedSellSignal * 100;
      confidence = 60 + (weightedSellSignal - weightedBuySignal) * 40;
    } else {
      signal = 'neutral';
      strength = Math.max(weightedBuySignal, weightedSellSignal) * 60; // Lower max strength for neutral
      confidence = 50 + Math.abs(weightedBuySignal - weightedSellSignal) * 20;
    }
    
    // Generate reasoning text
    const signalTexts = signals.map(s => s.reasoning).join(' ');
    const reasoning = `Derivatives market analysis: ${signalTexts}`;
    
    return {
      signal,
      strength: Math.min(100, strength),
      reasoning,
      confidence: Math.min(100, confidence),
      signals
    };
  } catch (error) {
    console.error('Error generating combined derivatives signal:', error);
    
    return {
      signal: 'neutral',
      strength: 0,
      reasoning: 'Error analyzing derivatives markets.',
      confidence: 0,
      signals: []
    };
  }
}