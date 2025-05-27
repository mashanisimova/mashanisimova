'use server';

import axios from 'axios';

export type MacroIndicator = {
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'bullish' | 'bearish' | 'neutral';
  description: string;
};

export type MacroReport = {
  timestamp: number;
  fearAndGreedIndex: number;
  btcDominance: number;
  globalMarketCap: number;
  indicators: MacroIndicator[];
  marketSentiment: 'fear' | 'greed' | 'neutral';
  riskLevel: 'low' | 'medium' | 'high';
  tradingRecommendation: string;
  dxy?: number;
  dxyTrend?: 'rising' | 'falling' | 'stable';
  vix?: number;
};

// Get Fear and Greed Index
async function getFearAndGreedIndex(): Promise<{ value: number; classification: string }> {
  try {
    const response = await axios.get('https://api.alternative.me/fng/');
    const data = response.data;
    
    if (data && data.data && data.data[0]) {
      return {
        value: parseInt(data.data[0].value),
        classification: data.data[0].value_classification
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch Fear and Greed Index:', error);
    // Return a fallback neutral value if API fails
    return { value: 50, classification: 'neutral' };
  }
}

// Get BTC Dominance and Global Market Cap
async function getMarketMetrics(): Promise<{ btcDominance: number; globalMarketCap: number }> {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/global');
    const data = response.data;
    
    if (data && data.data) {
      return {
        btcDominance: data.data.bitcoin_dominance || 40,
        globalMarketCap: data.data.total_market_cap.usd || 1000000000000
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Failed to fetch market metrics:', error);
    // Return fallback values if API fails
    return { btcDominance: 40, globalMarketCap: 1000000000000 };
  }
}

// Get economic indicators (simplified mock data for now)
async function getEconomicIndicators(): Promise<MacroIndicator[]> {
  // In a real implementation, this would fetch from economic data APIs
  // For now, we'll use mock data
  
  return [
    {
      name: 'US Inflation Rate',
      value: 3.8,
      previousValue: 4.1,
      change: -0.3,
      trend: 'down',
      impact: 'bullish',
      description: 'Year-over-year inflation rate in the United States'
    },
    {
      name: 'US Unemployment Rate',
      value: 3.9,
      previousValue: 3.7,
      change: 0.2,
      trend: 'up',
      impact: 'bearish',
      description: 'Percentage of the US labor force that is unemployed'
    },
    {
      name: 'Fed Interest Rate',
      value: 5.25,
      previousValue: 5.25,
      change: 0,
      trend: 'stable',
      impact: 'neutral',
      description: 'Federal Reserve benchmark interest rate'
    },
    {
      name: 'US Dollar Index',
      value: 104.2,
      previousValue: 103.5,
      change: 0.7,
      trend: 'up',
      impact: 'bearish',
      description: 'Measure of the value of the US dollar relative to a basket of foreign currencies'
    },
    {
      name: 'VIX Volatility Index',
      value: 18.4,
      previousValue: 20.2,
      change: -1.8,
      trend: 'down',
      impact: 'bullish',
      description: 'Market expectation of 30-day forward-looking volatility'
    }
  ];
}

// Generate a trading recommendation based on macro conditions
function generateTradingRecommendation(fearIndex: number, btcDominance: number, indicators: MacroIndicator[]): string {
  let bullishFactors = 0;
  let bearishFactors = 0;
  
  // Consider fear index
  if (fearIndex < 25) {
    bullishFactors += 2; // Extreme fear often indicates buying opportunity
  } else if (fearIndex > 75) {
    bearishFactors += 2; // Extreme greed often indicates selling opportunity
  }
  
  // Consider BTC dominance
  if (btcDominance > 50) {
    bullishFactors += 1; // High BTC dominance can indicate less altcoin speculation
  } else if (btcDominance < 40) {
    bearishFactors += 1; // Low BTC dominance can indicate excessive altcoin speculation
  }
  
  // Consider economic indicators
  indicators.forEach(indicator => {
    if (indicator.impact === 'bullish') bullishFactors += 1;
    if (indicator.impact === 'bearish') bearishFactors += 1;
  });
  
  // Generate recommendation
  if (bullishFactors > bearishFactors + 2) {
    return 'Strong bullish bias. Consider increasing long positions on dips. Focus on blue-chip cryptocurrencies with strong fundamentals.';
  } else if (bullishFactors > bearishFactors) {
    return 'Moderately bullish. Maintain balanced portfolio with slight bias toward long positions. Use dollar-cost averaging for entries.';
  } else if (bearishFactors > bullishFactors + 2) {
    return 'Strong bearish bias. Consider reducing exposure and implementing hedging strategies. Focus on capital preservation.';
  } else if (bearishFactors > bullishFactors) {
    return 'Moderately bearish. Maintain caution with smaller position sizes and tighter stop losses. Look for short opportunities on rallies.';
  } else {
    return 'Neutral market conditions. Maintain balanced portfolio and focus on range-bound trading strategies. Wait for clearer directional signals.';
  }
}

// Determine risk level
function determineRiskLevel(fearIndex: number, indicators: MacroIndicator[], vixValue: number): 'low' | 'medium' | 'high' {
  const bearishIndicators = indicators.filter(i => i.impact === 'bearish').length;
  const dxyIndicator = indicators.find(i => i.name.includes('Dollar Index'));
  const dxyBearish = dxyIndicator?.trend === 'up';
  
  // Calculate risk factors
  let riskFactors = 0;
  
  // Fear index factor
  if (fearIndex > 70) riskFactors += 2;
  else if (fearIndex > 50) riskFactors += 1;
  else if (fearIndex < 30) riskFactors -= 1;
  else if (fearIndex < 20) riskFactors -= 2;
  
  // Bearish indicators factor
  if (bearishIndicators >= 4) riskFactors += 2;
  else if (bearishIndicators >= 2) riskFactors += 1;
  else if (bearishIndicators <= 1) riskFactors -= 1;
  
  // DXY factor (rising dollar typically increases risk for crypto)
  if (dxyBearish) riskFactors += 1;
  
  // VIX factor (market volatility)
  if (vixValue > 30) riskFactors += 2;
  else if (vixValue > 20) riskFactors += 1;
  else if (vixValue < 15) riskFactors -= 1;
  
  // Determine risk level based on combined factors
  if (riskFactors >= 2) {
    return 'high';
  } else if (riskFactors <= -2) {
    return 'low';
  } else {
    return 'medium';
  }
}

// Get DXY (US Dollar Index) data
async function getDXYData(): Promise<{ value: number; trend: 'rising' | 'falling' | 'stable' }> {
  try {
    // In a real implementation, this would fetch from a financial API
    // For now, we'll use the mocked data from indicators
    const dxyIndicator = (await getEconomicIndicators()).find(i => i.name.includes('Dollar Index'));
    
    if (dxyIndicator) {
      return {
        value: dxyIndicator.value,
        trend: dxyIndicator.trend as 'rising' | 'falling' | 'stable'
      };
    }
    
    // Fallback values
    return { value: 104.2, trend: 'stable' };
  } catch (error) {
    console.error('Failed to fetch DXY data:', error);
    // Return fallback values
    return { value: 104.2, trend: 'stable' };
  }
}

// Get VIX (Volatility Index) data
async function getVIXData(): Promise<number> {
  try {
    // In a real implementation, this would fetch from a financial API
    // For now, we'll use the mocked data from indicators
    const vixIndicator = (await getEconomicIndicators()).find(i => i.name.includes('VIX'));
    
    if (vixIndicator) {
      return vixIndicator.value;
    }
    
    // Fallback value
    return 18.4;
  } catch (error) {
    console.error('Failed to fetch VIX data:', error);
    // Return fallback value
    return 18.4;
  }
}

// Get comprehensive macro report
export async function getMacroReport(): Promise<MacroReport> {
  const [fearAndGreedData, marketMetrics, indicators, dxyData, vixValue] = await Promise.all([
    getFearAndGreedIndex(),
    getMarketMetrics(),
    getEconomicIndicators(),
    getDXYData(),
    getVIXData()
  ]);
  
  const fearIndex = fearAndGreedData.value;
  const marketSentiment = fearIndex < 40 ? 'fear' : fearIndex > 60 ? 'greed' : 'neutral';
  const riskLevel = determineRiskLevel(fearIndex, indicators, vixValue);
  const tradingRecommendation = generateTradingRecommendation(fearIndex, marketMetrics.btcDominance, indicators);
  
  return {
    timestamp: Date.now(),
    fearAndGreedIndex: fearIndex,
    btcDominance: marketMetrics.btcDominance,
    globalMarketCap: marketMetrics.globalMarketCap,
    indicators,
    marketSentiment,
    riskLevel,
    tradingRecommendation,
    dxy: dxyData.value,
    dxyTrend: dxyData.trend,
    vix: vixValue
  };
}
