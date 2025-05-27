'use server';

import axios from 'axios';
import { MacroReport } from './macroeconomics';

export type PanicLevels = 'extreme_fear' | 'fear' | 'neutral' | 'greed' | 'extreme_greed';

export type MarketPanicData = {
  timestamp: number;
  panicLevel: PanicLevels;
  panicScore: number; // 0-100
  volatilityLevel: 'low' | 'moderate' | 'high' | 'extreme';
  volatilityScore: number; // 0-100
  recentDrawdown: number; // Percentage from recent high
  marketSentiment: string;
  capitulationSignals: {
    longLiquidations: number; // USD millions
    shortLiquidations: number; // USD millions
    fundingRates: number; // Average funding rate
    volumeSpike: boolean;
    isCapitulationDetected: boolean;
  };
  contraryIndicators: {
    fearGreedExtreme: boolean;
    shortLongRatioExtreme: boolean;
    putCallRatioExtreme: boolean;
    openInterestChange: number; // Percentage
  };
  signal: 'buy' | 'sell' | 'neutral';
  signalStrength: number; // 0-100
  recommendedAction: string;
};

// Get market panic data including capitulation and fear/greed extremes
export async function getMarketPanicData(macroReport?: MacroReport): Promise<MarketPanicData> {
  console.log('Analyzing market panic conditions');
  
  // Get fear and greed index from macro report if available
  const fearGreedIndex = macroReport?.fearAndGreedIndex || Math.floor(Math.random() * 100);
  
  // Mock data generation - in production, get real data from APIs
  const marketDrawdown = Math.random() * 30; // 0-30% drawdown from recent high
  const longLiquidations = Math.random() * 300; // 0-300M USD
  const shortLiquidations = Math.random() * 300; // 0-300M USD
  const fundingRate = (Math.random() * 0.002 - 0.001); // -0.1% to 0.1%
  const volumeSpike = Math.random() > 0.7; // 30% chance of volume spike
  const putCallRatio = Math.random() * 1.5 + 0.5; // 0.5-2.0
  const shortLongRatio = Math.random() * 1.5 + 0.5; // 0.5-2.0
  const openInterestChange = Math.random() * 20 - 10; // -10% to 10%
  
  // Determine panic level based on fear & greed index
  let panicLevel: PanicLevels;
  if (fearGreedIndex <= 20) panicLevel = 'extreme_fear';
  else if (fearGreedIndex <= 40) panicLevel = 'fear';
  else if (fearGreedIndex <= 60) panicLevel = 'neutral';
  else if (fearGreedIndex <= 80) panicLevel = 'greed';
  else panicLevel = 'extreme_greed';
  
  // Determine volatility level based on recent price action
  let volatilityLevel: 'low' | 'moderate' | 'high' | 'extreme';
  let volatilityScore: number;
  
  // Use VIX from macro report if available, otherwise generate random
  const vixValue = macroReport?.vix || (Math.random() * 30 + 10); // 10-40 range
  
  if (vixValue < 15) {
    volatilityLevel = 'low';
    volatilityScore = 25;
  } else if (vixValue < 25) {
    volatilityLevel = 'moderate';
    volatilityScore = 50;
  } else if (vixValue < 35) {
    volatilityLevel = 'high';
    volatilityScore = 75;
  } else {
    volatilityLevel = 'extreme';
    volatilityScore = 100;
  }
  
  // Detect capitulation based on multiple factors
  const isCapitulationDetected = (
    (longLiquidations > 200 || shortLiquidations > 200) && // Large liquidations
    volumeSpike && // Volume spike
    marketDrawdown > 15 // Significant drawdown
  );
  
  // Check for extreme indicators (contrarian signals)
  const fearGreedExtreme = fearGreedIndex < 20 || fearGreedIndex > 80;
  const shortLongRatioExtreme = shortLongRatio < 0.6 || shortLongRatio > 1.4;
  const putCallRatioExtreme = putCallRatio < 0.6 || putCallRatio > 1.4;
  
  // Generate market sentiment text
  let marketSentiment = '';
  if (panicLevel === 'extreme_fear') {
    marketSentiment = 'Extreme fear dominates the market. Potential buying opportunity for contrarians.';
  } else if (panicLevel === 'fear') {
    marketSentiment = 'Fear is present in the market. Caution warranted but potential opportunities emerging.';
  } else if (panicLevel === 'neutral') {
    marketSentiment = 'Market sentiment is balanced. No extreme positioning.';
  } else if (panicLevel === 'greed') {
    marketSentiment = 'Greed is present in the market. Consider reducing risk exposure.';
  } else { // extreme_greed
    marketSentiment = 'Extreme greed in the market. Potential selling opportunity for contrarians.';
  }
  
  // Determine signal based on contrarian approach to extreme fear/greed
  let signal: 'buy' | 'sell' | 'neutral';
  let signalStrength = 0;
  let recommendedAction = '';
  
  // Generate signal strength components
  let fearGreedComponent = 0;
  let capitulationComponent = 0;
  let contraryIndicatorsComponent = 0;
  
  // Fear & Greed component
  if (panicLevel === 'extreme_fear') {
    fearGreedComponent = 100 - fearGreedIndex; // Higher strength for lower index
    signal = 'buy';
    recommendedAction = 'Consider gradual accumulation as markets often recover from extreme fear.';
  } else if (panicLevel === 'extreme_greed') {
    fearGreedComponent = fearGreedIndex - 80; // Higher strength for higher index
    signal = 'sell';
    recommendedAction = 'Consider taking profits or hedging as markets often correct from extreme greed.';
  } else if (panicLevel === 'fear') {
    fearGreedComponent = (40 - fearGreedIndex) * 1.5;
    signal = 'buy';
    recommendedAction = 'Monitor for entry opportunities while maintaining caution.';
  } else if (panicLevel === 'greed') {
    fearGreedComponent = (fearGreedIndex - 60) * 1.5;
    signal = 'sell';
    recommendedAction = 'Exercise caution with new long positions; consider partial profit taking.';
  } else {
    signal = 'neutral';
    recommendedAction = 'Maintain balanced positioning; no extreme action recommended.';
  }
  
  // Capitulation component
  if (isCapitulationDetected) {
    capitulationComponent = 80;
    if (longLiquidations > shortLiquidations * 1.5) {
      // If longs are getting liquidated much more than shorts
      if (signal !== 'buy') {
        signal = 'buy';
        recommendedAction = 'Potential bottom formation after long liquidation cascade. Consider gradual entry.';
      }
    } else if (shortLiquidations > longLiquidations * 1.5) {
      // If shorts are getting liquidated much more than longs
      if (signal !== 'sell') {
        signal = 'sell';
        recommendedAction = 'Potential local top after short squeeze. Consider taking profits.';
      }
    }
  }
  
  // Contrary indicators component
  let contraryCount = 0;
  if (fearGreedExtreme) contraryCount++;
  if (shortLongRatioExtreme) contraryCount++;
  if (putCallRatioExtreme) contraryCount++;
  if (Math.abs(openInterestChange) > 7) contraryCount++;
  
  contraryIndicatorsComponent = contraryCount * 20; // 0-80 based on how many contrary indicators
  
  // Calculate final signal strength
  if (signal === 'buy' || signal === 'sell') {
    signalStrength = (
      (fearGreedComponent * 0.5) +
      (capitulationComponent * 0.3) +
      (contraryIndicatorsComponent * 0.2)
    );
  } else {
    signalStrength = 20; // Base neutral signal strength
  }
  
  // Cap signal strength at 100
  signalStrength = Math.min(100, signalStrength);
  
  return {
    timestamp: Date.now(),
    panicLevel,
    panicScore: fearGreedIndex,
    volatilityLevel,
    volatilityScore,
    recentDrawdown: marketDrawdown,
    marketSentiment,
    capitulationSignals: {
      longLiquidations,
      shortLiquidations,
      fundingRates: fundingRate,
      volumeSpike,
      isCapitulationDetected
    },
    contraryIndicators: {
      fearGreedExtreme,
      shortLongRatioExtreme,
      putCallRatioExtreme,
      openInterestChange
    },
    signal,
    signalStrength,
    recommendedAction
  };
}

// Detect market regimes (trending, ranging, volatile, etc)
export async function detectMarketRegime(symbol: string, candles: any[]): Promise<{
  regime: 'strong_uptrend' | 'weak_uptrend' | 'strong_downtrend' | 'weak_downtrend' | 'ranging' | 'volatile' | 'accumulation' | 'distribution';
  confidence: number; // 0-100
  duration: number; // How many candles this regime has persisted
  volatility: number; // Normalized volatility
  momentum: number; // -100 to 100, negative for downtrend
  recommendedStrategies: string[];
}> {
  console.log(`Detecting market regime for ${symbol}`);
  
  if (!candles || candles.length < 20) {
    throw new Error('Not enough candles to detect market regime');
  }
  
  // Extract close prices
  const prices = candles.map((candle: any) => parseFloat(candle[4]));
  
  // Calculate basic metrics
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  // Calculate average return and volatility
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const volatility = Math.sqrt(
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  ) * Math.sqrt(returns.length); // Annualization factor
  
  // Calculate momentum (using last 20 vs last 40 candles)
  const recent20 = prices.slice(-20);
  const recent40 = prices.slice(-40);
  const avg20 = recent20.reduce((sum, p) => sum + p, 0) / recent20.length;
  const avg40 = recent40.length > 0 ? recent40.reduce((sum, p) => sum + p, 0) / recent40.length : avg20;
  const momentum = ((avg20 / avg40) - 1) * 100; // Percentage change from avg40 to avg20
  
  // Calculate range-bound behavior
  const highLowRange = Math.max(...prices.slice(-20)) / Math.min(...prices.slice(-20)) - 1;
  const isRangeBound = highLowRange < 0.1; // Less than 10% range
  
  // Calculate up vs down candles
  const upCandles = returns.filter(r => r > 0).length;
  const downCandles = returns.filter(r => r < 0).length;
  const upDownRatio = upCandles / Math.max(1, downCandles);
  
  // Determine market regime
  let regime: 'strong_uptrend' | 'weak_uptrend' | 'strong_downtrend' | 'weak_downtrend' | 'ranging' | 'volatile' | 'accumulation' | 'distribution';
  let confidence = 0;
  let recommendedStrategies: string[] = [];
  
  if (isRangeBound) {
    // Check if it's accumulation or distribution
    if (momentum > 1) {
      regime = 'accumulation';
      confidence = 60 + Math.min(40, Math.abs(momentum));
      recommendedStrategies = [
        'Buy support levels',
        'Breakout anticipation strategies',
        'Mean reversion within range'
      ];
    } else if (momentum < -1) {
      regime = 'distribution';
      confidence = 60 + Math.min(40, Math.abs(momentum));
      recommendedStrategies = [
        'Sell resistance levels',
        'Prepare for downside breakouts',
        'Reduce overall exposure'
      ];
    } else {
      regime = 'ranging';
      confidence = 70 + Math.min(30, 300 * (1 - highLowRange)); // Higher confidence for tighter ranges
      recommendedStrategies = [
        'Range trading (buy support, sell resistance)',
        'Mean reversion strategies',
        'Reduced position sizing'
      ];
    }
  } else if (volatility > 0.04) { // High volatility threshold
    regime = 'volatile';
    confidence = 50 + Math.min(50, volatility * 1000);
    recommendedStrategies = [
      'Reduce position sizes',
      'Use tight stop losses',
      'Consider staying in cash or stablecoins',
      'Look for capitulation signals'
    ];
  } else if (momentum > 5) { // Strong positive momentum
    if (upDownRatio > 1.5) {
      regime = 'strong_uptrend';
      confidence = 60 + Math.min(40, momentum);
      recommendedStrategies = [
        'Trend following strategies',
        'Buy dips',
        'Trailing stops to protect profits',
        'Focus on high momentum symbols'
      ];
    } else {
      regime = 'weak_uptrend';
      confidence = 50 + Math.min(30, momentum);
      recommendedStrategies = [
        'Selective buying',
        'Tighter stop losses',
        'Partial profit taking on rallies'
      ];
    }
  } else if (momentum < -5) { // Strong negative momentum
    if (upDownRatio < 0.7) {
      regime = 'strong_downtrend';
      confidence = 60 + Math.min(40, Math.abs(momentum));
      recommendedStrategies = [
        'Short selling on rallies',
        'Maintain strict risk management',
        'Avoid catching falling knives',
        'Focus on relative strength'
      ];
    } else {
      regime = 'weak_downtrend';
      confidence = 50 + Math.min(30, Math.abs(momentum));
      recommendedStrategies = [
        'Reduced exposure',
        'Selective short positions',
        'Focus on defense and capital preservation'
      ];
    }
  } else {
    // Default to ranging if nothing else fits
    regime = 'ranging';
    confidence = 50;
    recommendedStrategies = [
      'Range trading strategies',
      'Wait for clearer signals',
      'Reduced position sizing'
    ];
  }
  
  // Estimate how long the current regime has persisted
  // This is a simplified approach - a real implementation would be more sophisticated
  let duration = 1;
  let consistentWithRegime = true;
  let i = returns.length - 2; // Start from second-to-last return
  
  while (i >= 0 && consistentWithRegime) {
    // Check if this return is consistent with the current regime
    if (regime.includes('uptrend') && returns[i] < -0.01) {
      consistentWithRegime = false;
    } else if (regime.includes('downtrend') && returns[i] > 0.01) {
      consistentWithRegime = false;
    } else if (regime === 'volatile' && Math.abs(returns[i]) < 0.02) {
      consistentWithRegime = false;
    } else if ((regime === 'ranging' || regime === 'accumulation' || regime === 'distribution') 
              && Math.abs(returns[i]) > 0.02) {
      consistentWithRegime = false;
    } else {
      duration++;
      i--;
    }
  }
  
  return {
    regime,
    confidence,
    duration,
    volatility: Math.min(100, volatility * 1000), // Normalize to 0-100 scale
    momentum,
    recommendedStrategies
  };
}

// Function to get combined market panic and regime data
export async function getMarketConditionAnalysis(symbol: string, candles: any[], macroReport?: MacroReport): Promise<{
  panicData: MarketPanicData;
  regimeData: Awaited<ReturnType<typeof detectMarketRegime>>;
  combinedSignal: 'buy' | 'sell' | 'neutral';
  combinedStrength: number;
  tradingRecommendation: string;
}> {
  console.log(`Getting combined market condition analysis for ${symbol}`);
  
  // Get both analyses in parallel
  const [panicData, regimeData] = await Promise.all([
    getMarketPanicData(macroReport),
    detectMarketRegime(symbol, candles)
  ]);
  
  // Determine combined signal
  let combinedSignal: 'buy' | 'sell' | 'neutral';
  let combinedStrength = 0;
  let tradingRecommendation = '';
  
  // Convert regime to signal
  let regimeSignal: 'buy' | 'sell' | 'neutral';
  let regimeSignalStrength = 0;
  
  if (regimeData.regime === 'strong_uptrend' || regimeData.regime === 'weak_uptrend') {
    regimeSignal = 'buy';
    regimeSignalStrength = regimeData.regime === 'strong_uptrend' ? 80 : 60;
  } else if (regimeData.regime === 'strong_downtrend' || regimeData.regime === 'weak_downtrend') {
    regimeSignal = 'sell';
    regimeSignalStrength = regimeData.regime === 'strong_downtrend' ? 80 : 60;
  } else if (regimeData.regime === 'accumulation') {
    regimeSignal = 'buy';
    regimeSignalStrength = 70;
  } else if (regimeData.regime === 'distribution') {
    regimeSignal = 'sell';
    regimeSignalStrength = 70;
  } else {
    regimeSignal = 'neutral';
    regimeSignalStrength = 50;
  }
  
  // Adjust regime strength by confidence
  regimeSignalStrength = regimeSignalStrength * (regimeData.confidence / 100);
  
  // Calculate combined signal with weights
  const panicWeight = 0.4;
  const regimeWeight = 0.6;
  
  const panicValue = panicData.signal === 'buy' ? 1 : panicData.signal === 'sell' ? -1 : 0;
  const regimeValue = regimeSignal === 'buy' ? 1 : regimeSignal === 'sell' ? -1 : 0;
  
  const combinedValue = (
    panicValue * panicWeight * (panicData.signalStrength / 100) +
    regimeValue * regimeWeight * (regimeSignalStrength / 100)
  );
  
  // Determine final signal
  if (combinedValue > 0.2) {
    combinedSignal = 'buy';
    combinedStrength = Math.min(100, Math.abs(combinedValue) * 100);
  } else if (combinedValue < -0.2) {
    combinedSignal = 'sell';
    combinedStrength = Math.min(100, Math.abs(combinedValue) * 100);
  } else {
    combinedSignal = 'neutral';
    combinedStrength = Math.min(50, Math.abs(combinedValue) * 100);
  }
  
  // Generate trading recommendation based on combined analysis
  if (combinedSignal === 'buy') {
    if (panicData.panicLevel === 'extreme_fear' && 
        (regimeData.regime === 'accumulation' || regimeData.regime === 'volatile')) {
      tradingRecommendation = 
        'Strong buy signal: Extreme fear combined with potential accumulation phase. ' +
        'Consider gradual position building using dollar cost averaging.';
    } else if (regimeData.regime.includes('uptrend')) {
      tradingRecommendation = 
        `Buy signal: Market in ${regimeData.regime} with ${panicData.panicLevel} sentiment. ` +
        'Focus on trend-following strategies and buying dips.';
    } else {
      tradingRecommendation = 
        'Moderate buy signal: Consider selective entries with strict risk management.';
    }
  } else if (combinedSignal === 'sell') {
    if (panicData.panicLevel === 'extreme_greed' && 
        (regimeData.regime === 'distribution' || regimeData.regime === 'volatile')) {
      tradingRecommendation = 
        'Strong sell signal: Extreme greed combined with distribution phase. ' +
        'Consider taking profits or implementing hedging strategies.';
    } else if (regimeData.regime.includes('downtrend')) {
      tradingRecommendation = 
        `Sell signal: Market in ${regimeData.regime} with ${panicData.panicLevel} sentiment. ` +
        'Focus on capital preservation and consider selective short positions.';
    } else {
      tradingRecommendation = 
        'Moderate sell signal: Consider reducing exposure and tightening stop losses.';
    }
  } else {
    tradingRecommendation = 
      'Neutral signal: Market conditions unclear. Maintain balanced positioning and reduced position sizes.';
  }
  
  return {
    panicData,
    regimeData,
    combinedSignal,
    combinedStrength,
    tradingRecommendation
  };
}
