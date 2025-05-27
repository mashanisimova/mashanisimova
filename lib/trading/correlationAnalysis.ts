'use server';

import axios from 'axios';
import { getKlineData } from '@/lib/api/bybit';

type Asset = {
  symbol: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
  name: string;
};

type CorrelationData = {
  timestamp: number;
  period: '1d' | '7d' | '30d' | '90d';
  baseAsset: string;
  correlations: {
    asset: Asset;
    correlation: number; // -1 to 1
    strength: 'strong_positive' | 'moderate_positive' | 'weak_positive' | 
              'weak_negative' | 'moderate_negative' | 'strong_negative' | 'none';
    trend: 'increasing' | 'decreasing' | 'stable';
    historicalValues: number[];
  }[];
};

type TradingSignal = {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  reasoning: string;
};

// Traditional markets to monitor
const TRADITIONAL_ASSETS: Asset[] = [
  { symbol: 'SPX', type: 'stock', name: 'S&P 500' },
  { symbol: 'NDX', type: 'stock', name: 'Nasdaq 100' },
  { symbol: 'DJI', type: 'stock', name: 'Dow Jones Industrial' },
  { symbol: 'XAU', type: 'commodity', name: 'Gold' },
  { symbol: 'DXY', type: 'forex', name: 'US Dollar Index' },
  { symbol: 'VIX', type: 'stock', name: 'Volatility Index' },
  { symbol: 'TYX', type: 'stock', name: '30-Year Treasury Yield' },
  { symbol: 'TNX', type: 'stock', name: '10-Year Treasury Yield' },
];

// Get correlation data between crypto and traditional markets
export async function getCorrelationData(cryptoSymbol: string, period: '1d' | '7d' | '30d' | '90d' = '30d'): Promise<CorrelationData> {
  console.log(`Getting correlation data for ${cryptoSymbol} over ${period} period`);
  
  try {
    // In a real implementation, this would fetch price data for both crypto and traditional assets
    // from appropriate APIs, then calculate correlations
    // For this example, we'll generate realistic mock data
    
    // Get actual crypto price data from Bybit if possible
    const interval = period === '1d' ? '60' : '1d'; // Use 1h for 1d period, daily for others
    const limit = period === '1d' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 90;
    
    let cryptoPrices: number[] = [];
    try {
      const klineData = await getKlineData(cryptoSymbol, interval, limit);
      if (klineData && klineData.length > 0) {
        cryptoPrices = klineData.map((candle: any) => parseFloat(candle[4])); // Close prices
      }
    } catch (error) {
      console.error(`Error fetching kline data for ${cryptoSymbol}:`, error);
      // Generate mock data if API fails
      cryptoPrices = generateMockPriceData(limit);
    }
    
    // Generate correlations with realistic patterns
    const correlations = TRADITIONAL_ASSETS.map(asset => {
      // Different assets have different typical correlations with crypto
      let baseCorrelation = 0;
      let historicalValues: number[] = [];
      
      // Generate realistic correlation values based on asset type
      switch (asset.symbol) {
        case 'SPX':
        case 'NDX':
          // Tech stocks often have moderate positive correlation with crypto
          baseCorrelation = 0.4 + (Math.random() * 0.3);
          break;
        case 'DXY':
          // Dollar typically has negative correlation with crypto
          baseCorrelation = -0.3 - (Math.random() * 0.4);
          break;
        case 'VIX':
          // VIX (fear index) often has slight negative correlation with crypto
          baseCorrelation = -0.2 - (Math.random() * 0.3);
          break;
        case 'XAU':
          // Gold has variable correlation with crypto
          baseCorrelation = 0.1 + (Math.random() * 0.4) - 0.2;
          break;
        case 'TNX':
        case 'TYX':
          // Bond yields typically have slight negative correlation with crypto
          baseCorrelation = -0.1 - (Math.random() * 0.3);
          break;
        default:
          baseCorrelation = (Math.random() * 0.6) - 0.3; // Random correlation
      }
      
      // Generate historical correlation values with realistic trends
      const trendDirection = Math.random() > 0.5 ? 1 : -1;
      const trendStrength = Math.random() * 0.01; // Small daily changes
      
      historicalValues = Array(10).fill(0).map((_, i) => {
        // Correlation changes over time with some randomness
        return Math.max(-1, Math.min(1, baseCorrelation + (trendDirection * i * trendStrength) + ((Math.random() - 0.5) * 0.1)));
      });
      
      // Determine correlation strength category
      let strength: 'strong_positive' | 'moderate_positive' | 'weak_positive' | 
                   'weak_negative' | 'moderate_negative' | 'strong_negative' | 'none';
      
      const absCorrelation = Math.abs(baseCorrelation);
      if (absCorrelation < 0.2) strength = 'none';
      else if (baseCorrelation > 0) {
        strength = absCorrelation > 0.6 ? 'strong_positive' : 
                  absCorrelation > 0.4 ? 'moderate_positive' : 'weak_positive';
      } else {
        strength = absCorrelation > 0.6 ? 'strong_negative' : 
                  absCorrelation > 0.4 ? 'moderate_negative' : 'weak_negative';
      }
      
      // Determine trend
      const trend = historicalValues[historicalValues.length - 1] > historicalValues[0] ? 'increasing' : 
                   historicalValues[historicalValues.length - 1] < historicalValues[0] ? 'decreasing' : 'stable';
      
      return {
        asset,
        correlation: baseCorrelation,
        strength,
        trend,
        historicalValues
      };
    });
    
    return {
      timestamp: Date.now(),
      period,
      baseAsset: cryptoSymbol,
      correlations
    };
  } catch (error) {
    console.error('Error calculating correlation data:', error);
    throw error;
  }
}

// Generate trading signals based on correlation data
export async function getCorrelationSignals(cryptoSymbol: string): Promise<TradingSignal> {
  try {
    // Get correlation data
    const correlationData = await getCorrelationData(cryptoSymbol);
    
    // Look for specific patterns that might generate signals
    let signalStrength = 0;
    let signalDirection = 0; // Positive for buy, negative for sell
    let reasonItems: string[] = [];
    
    // Check correlation with major indices
    const spCorrelation = correlationData.correlations.find(c => c.asset.symbol === 'SPX');
    const ndxCorrelation = correlationData.correlations.find(c => c.asset.symbol === 'NDX');
    
    // Check correlation with USD
    const dxyCorrelation = correlationData.correlations.find(c => c.asset.symbol === 'DXY');
    
    // Check correlation with VIX
    const vixCorrelation = correlationData.correlations.find(c => c.asset.symbol === 'VIX');
    
    // S&P 500 correlation signals
    if (spCorrelation) {
      if (spCorrelation.correlation > 0.6 && spCorrelation.trend === 'increasing') {
        // Strong and increasing correlation with S&P 500
        // If S&P is currently up, this is bullish for crypto
        signalDirection += 10;
        signalStrength += 15;
        reasonItems.push(`Strong increasing correlation with S&P 500 (${spCorrelation.correlation.toFixed(2)})`);
      } else if (spCorrelation.correlation < -0.6 && spCorrelation.trend === 'decreasing') {
        // Strong negative correlation getting stronger
        // If S&P is currently down, this is bullish for crypto
        signalDirection += 5;
        signalStrength += 10;
        reasonItems.push(`Strong negative correlation with S&P 500 strengthening (${spCorrelation.correlation.toFixed(2)})`);
      }
    }
    
    // USD correlation signals
    if (dxyCorrelation) {
      if (dxyCorrelation.correlation < -0.6) {
        // Strong negative correlation with USD
        // If USD is falling, this is bullish for crypto
        signalDirection += 15;
        signalStrength += 20;
        reasonItems.push(`Strong negative correlation with USD (${dxyCorrelation.correlation.toFixed(2)})`);
      } else if (dxyCorrelation.correlation > 0 && dxyCorrelation.trend === 'increasing') {
        // Unusual positive correlation with USD that's increasing
        // This is typically bearish as it breaks the normal pattern
        signalDirection -= 10;
        signalStrength += 15;
        reasonItems.push(`Unusual positive correlation with USD developing (${dxyCorrelation.correlation.toFixed(2)})`);
      }
    }
    
    // VIX correlation signals
    if (vixCorrelation) {
      if (vixCorrelation.correlation > 0.4) {
        // Positive correlation with VIX
        // Higher volatility expectations, potentially bearish short-term
        signalDirection -= 10;
        signalStrength += 15;
        reasonItems.push(`Positive correlation with VIX (${vixCorrelation.correlation.toFixed(2)})`);
      } else if (vixCorrelation.correlation < -0.4 && vixCorrelation.trend === 'decreasing') {
        // Strengthening negative correlation with VIX
        // Lower volatility, potentially bullish
        signalDirection += 5;
        signalStrength += 10;
        reasonItems.push(`Strengthening negative correlation with VIX (${vixCorrelation.correlation.toFixed(2)})`);
      }
    }
    
    // Calculate final signal
    let signal: 'buy' | 'sell' | 'neutral';
    let reasoning: string;
    
    if (signalDirection > 15 && signalStrength > 30) {
      signal = 'buy';
      reasoning = `Bullish correlation pattern: ${reasonItems.join(', ')}. Traditional market relationships suggest upside potential.`;
    } else if (signalDirection < -15 && signalStrength > 30) {
      signal = 'sell';
      reasoning = `Bearish correlation pattern: ${reasonItems.join(', ')}. Traditional market relationships suggest downside risk.`;
    } else {
      signal = 'neutral';
      reasoning = reasonItems.length > 0 ?
        `Mixed correlation signals: ${reasonItems.join(', ')}. No clear directional edge from traditional markets.` :
        `No significant correlation patterns detected with traditional markets.`;
      signalStrength = Math.min(signalStrength, 30); // Cap neutral signals at 30
    }
    
    return {
      signal,
      strength: signalStrength,
      reasoning
    };
  } catch (error) {
    console.error('Error generating correlation signals:', error);
    return {
      signal: 'neutral',
      strength: 0,
      reasoning: 'Error analyzing correlations with traditional markets.'
    };
  }
}

// Utility function to generate mock price data
function generateMockPriceData(length: number): number[] {
  const startPrice = 30000 + (Math.random() * 10000);
  const trend = Math.random() > 0.5 ? 1 : -1;
  const volatility = 0.01 + (Math.random() * 0.02);
  
  return Array(length).fill(0).map((_, i) => {
    return startPrice * (1 + ((trend * i / length) * 0.1) + ((Math.random() - 0.5) * volatility));
  });
}

// Get multi-timeframe correlation analysis
export async function getMultiTimeframeCorrelationAnalysis(cryptoSymbol: string): Promise<{
  daily: CorrelationData;
  weekly: CorrelationData;
  monthly: CorrelationData;
  tradingSignal: TradingSignal;
}> {
  try {
    // Fetch correlation data for different timeframes
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      getCorrelationData(cryptoSymbol, '1d'),
      getCorrelationData(cryptoSymbol, '7d'),
      getCorrelationData(cryptoSymbol, '30d')
    ]);
    
    // Generate trading signal based on combined analysis
    // We could weight longer timeframes more heavily
    const signal = await getCorrelationSignals(cryptoSymbol);
    
    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      tradingSignal: signal
    };
  } catch (error) {
    console.error('Error in multi-timeframe correlation analysis:', error);
    throw error;
  }
}