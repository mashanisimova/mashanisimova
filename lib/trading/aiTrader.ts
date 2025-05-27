'use client';

import { TradeRecord } from './autoTrader';
import { IndicatorSignal } from './indicators';

type StrategyPerformance = {
  name: string;
  winRate: number;
  avgProfit: number;
  totalTrades: number;
  score: number;
  timeframePerformance: Record<string, {
    winRate: number;
    avgProfit: number;
    totalTrades: number;
    score: number;
  }>;
  marketConditionPerformance: Record<string, {
    winRate: number;
    avgProfit: number;
    totalTrades: number;
    score: number;
  }>;
};

type MarketCondition = 'bullish' | 'bearish' | 'sideways' | 'volatile';

type AIModel = {
  strategyWeights: Record<string, number>;
  timeframeWeights: Record<string, number>;
  symbolWeights: Record<string, number>;
  marketConditionWeights: Record<MarketCondition, number>;
  lastUpdated: number;
  trainingIterations: number;
  learningRate: number;
};

// Default AI model
let aiModel: AIModel = {
  strategyWeights: {},
  timeframeWeights: {
    '5': 0.5,
    '15': 0.6,
    '60': 0.7,
    '240': 0.8,
    'D': 0.9
  },
  symbolWeights: {
    'BTCUSDT': 1.0,
    'ETHUSDT': 0.9,
    'SOLUSDT': 0.8
  },
  marketConditionWeights: {
    'bullish': 1.0,
    'bearish': 1.0,
    'sideways': 1.0,
    'volatile': 0.8
  },
  lastUpdated: Date.now(),
  trainingIterations: 0,
  learningRate: 0.05
};

// Initialize model with strategy weights
export function initializeAIModel(strategies: string[]): AIModel {
  console.log('Initializing AI model with strategies:', strategies);
  
  // Create equal initial weights for all strategies
  const strategyWeights: Record<string, number> = {};
  strategies.forEach(strategy => {
    strategyWeights[strategy] = 1.0; // Start with equal weights
  });
  
  aiModel = {
    ...aiModel,
    strategyWeights,
    lastUpdated: Date.now()
  };
  
  return aiModel;
}

// Train the model based on historical trade data
export function trainModel(tradeHistory: TradeRecord[]): AIModel {
  console.log(`Training AI model with ${tradeHistory.length} historical trades`);
  if (tradeHistory.length < 10) {
    console.log('Not enough trade history for meaningful training');
    return aiModel;
  }
  
  // Calculate strategy performance
  const strategyPerformance = calculateStrategyPerformance(tradeHistory);
  
  // Update strategy weights based on performance
  for (const strategy in strategyPerformance) {
    const performance = strategyPerformance[strategy];
    
    // Only update if we have meaningful data
    if (performance.totalTrades >= 5) {
      // Current weight
      const currentWeight = aiModel.strategyWeights[strategy] || 1.0;
      
      // Calculate new weight based on performance score
      // Score is normalized to 0-2 range where 1 is neutral, >1 is good, <1 is bad
      const newWeight = currentWeight * (0.8 + (performance.score * 0.4));
      
      // Apply learning rate to smooth changes
      aiModel.strategyWeights[strategy] = currentWeight + 
        (aiModel.learningRate * (newWeight - currentWeight));
      
      console.log(`Updated weight for ${strategy}: ${currentWeight.toFixed(2)} -> ${aiModel.strategyWeights[strategy].toFixed(2)}`);
    }
  }
  
  // Update timeframe weights
  const timeframePerformance = calculateTimeframePerformance(tradeHistory);
  for (const timeframe in timeframePerformance) {
    const performance = timeframePerformance[timeframe];
    
    if (performance.totalTrades >= 5) {
      const currentWeight = aiModel.timeframeWeights[timeframe] || 0.5;
      const newWeight = currentWeight * (0.8 + (performance.score * 0.4));
      
      aiModel.timeframeWeights[timeframe] = currentWeight + 
        (aiModel.learningRate * (newWeight - currentWeight));
    }
  }
  
  // Update symbol weights
  const symbolPerformance = calculateSymbolPerformance(tradeHistory);
  for (const symbol in symbolPerformance) {
    const performance = symbolPerformance[symbol];
    
    if (performance.totalTrades >= 5) {
      const currentWeight = aiModel.symbolWeights[symbol] || 0.5;
      const newWeight = currentWeight * (0.8 + (performance.score * 0.4));
      
      aiModel.symbolWeights[symbol] = currentWeight + 
        (aiModel.learningRate * (newWeight - currentWeight));
    }
  }
  
  // Update last training timestamp and iteration count
  aiModel.lastUpdated = Date.now();
  aiModel.trainingIterations += 1;
  
  // Adjust learning rate (decrease over time for stability)
  if (aiModel.trainingIterations > 10) {
    aiModel.learningRate = Math.max(0.01, aiModel.learningRate * 0.95);
  }
  
  return aiModel;
}

// Adjust signal strength based on AI model
export function adjustSignalStrength(
  signals: Record<string, IndicatorSignal>,
  symbol: string,
  timeframe: string,
  marketCondition: MarketCondition
): Record<string, IndicatorSignal> {
  console.log('Adjusting signal strength with AI model');
  
  const adjustedSignals: Record<string, IndicatorSignal> = {};
  
  // Apply strategy weights to each signal
  for (const strategy in signals) {
    const signal = signals[strategy];
    const strategyWeight = aiModel.strategyWeights[strategy] || 1.0;
    const timeframeWeight = aiModel.timeframeWeights[timeframe] || 0.5;
    const symbolWeight = aiModel.symbolWeights[symbol] || 0.5;
    const marketWeight = aiModel.marketConditionWeights[marketCondition] || 1.0;
    
    // Calculate combined weight
    const combinedWeight = strategyWeight * timeframeWeight * symbolWeight * marketWeight;
    
    // Adjust signal strength (cap at 100)
    const adjustedStrength = Math.min(100, signal.strength * combinedWeight);
    
    adjustedSignals[strategy] = {
      ...signal,
      strength: adjustedStrength,
      meta: {
        ...signal.meta,
        originalStrength: signal.strength,
        adjustment: combinedWeight
      }
    };
  }
  
  return adjustedSignals;
}

// Helper functions for calculating performance metrics
function calculateStrategyPerformance(trades: TradeRecord[]): Record<string, StrategyPerformance> {
  const performance: Record<string, StrategyPerformance> = {};
  
  // Group trades by strategy
  for (const trade of trades) {
    if (!trade.strategy) continue;
    
    if (!performance[trade.strategy]) {
      performance[trade.strategy] = {
        name: trade.strategy,
        winRate: 0,
        avgProfit: 0,
        totalTrades: 0,
        score: 0,
        timeframePerformance: {},
        marketConditionPerformance: {}
      };
    }
    
    // Add trade to the strategy stats
    performance[trade.strategy].totalTrades += 1;
    
    // Only consider closed trades for profit calculation
    if (trade.status === 'closed' && trade.profitLoss !== undefined) {
      // Update win count
      if (trade.profitLoss > 0) {
        performance[trade.strategy].winRate += 1;
      }
      
      // Update profit sum
      performance[trade.strategy].avgProfit += trade.profitLoss;
      
      // Update timeframe performance
      if (trade.timeframe) {
        if (!performance[trade.strategy].timeframePerformance[trade.timeframe]) {
          performance[trade.strategy].timeframePerformance[trade.timeframe] = {
            winRate: 0,
            avgProfit: 0,
            totalTrades: 0,
            score: 0
          };
        }
        
        const tfPerf = performance[trade.strategy].timeframePerformance[trade.timeframe];
        tfPerf.totalTrades += 1;
        if (trade.profitLoss > 0) {
          tfPerf.winRate += 1;
        }
        tfPerf.avgProfit += trade.profitLoss;
      }
    }
  }
  
  // Calculate final metrics
  for (const strategy in performance) {
    const stratPerf = performance[strategy];
    
    // Calculate win rate as percentage
    if (stratPerf.totalTrades > 0) {
      stratPerf.winRate = (stratPerf.winRate / stratPerf.totalTrades) * 100;
    }
    
    // Calculate average profit per trade
    if (stratPerf.totalTrades > 0) {
      stratPerf.avgProfit = stratPerf.avgProfit / stratPerf.totalTrades;
    }
    
    // Calculate timeframe performance metrics
    for (const tf in stratPerf.timeframePerformance) {
      const tfPerf = stratPerf.timeframePerformance[tf];
      
      if (tfPerf.totalTrades > 0) {
        tfPerf.winRate = (tfPerf.winRate / tfPerf.totalTrades) * 100;
        tfPerf.avgProfit = tfPerf.avgProfit / tfPerf.totalTrades;
        
        // Calculate score (combines win rate and profit)
        tfPerf.score = (tfPerf.winRate / 50) * (tfPerf.avgProfit > 0 ? (1 + tfPerf.avgProfit / 100) : 0.5);
      }
    }
    
    // Calculate overall strategy score
    // Score formula weights both win rate and average profit
    // Win rate is normalized to 1 at 50% (breakeven)
    // Profit factor increases or decreases the score
    stratPerf.score = (stratPerf.winRate / 50) * (stratPerf.avgProfit > 0 ? (1 + stratPerf.avgProfit / 100) : 0.5);
  }
  
  return performance;
}

function calculateTimeframePerformance(trades: TradeRecord[]): Record<string, { winRate: number; avgProfit: number; totalTrades: number; score: number; }> {
  const performance: Record<string, { winRate: number; avgProfit: number; totalTrades: number; score: number; }> = {};
  
  // Group trades by timeframe
  for (const trade of trades) {
    if (!trade.timeframe) continue;
    
    if (!performance[trade.timeframe]) {
      performance[trade.timeframe] = {
        winRate: 0,
        avgProfit: 0,
        totalTrades: 0,
        score: 0
      };
    }
    
    // Add trade to the timeframe stats
    performance[trade.timeframe].totalTrades += 1;
    
    // Only consider closed trades for profit calculation
    if (trade.status === 'closed' && trade.profitLoss !== undefined) {
      // Update win count
      if (trade.profitLoss > 0) {
        performance[trade.timeframe].winRate += 1;
      }
      
      // Update profit sum
      performance[trade.timeframe].avgProfit += trade.profitLoss;
    }
  }
  
  // Calculate final metrics
  for (const timeframe in performance) {
    const tfPerf = performance[timeframe];
    
    // Calculate win rate as percentage
    if (tfPerf.totalTrades > 0) {
      tfPerf.winRate = (tfPerf.winRate / tfPerf.totalTrades) * 100;
    }
    
    // Calculate average profit per trade
    if (tfPerf.totalTrades > 0) {
      tfPerf.avgProfit = tfPerf.avgProfit / tfPerf.totalTrades;
    }
    
    // Calculate score (combines win rate and profit)
    tfPerf.score = (tfPerf.winRate / 50) * (tfPerf.avgProfit > 0 ? (1 + tfPerf.avgProfit / 100) : 0.5);
  }
  
  return performance;
}

function calculateSymbolPerformance(trades: TradeRecord[]): Record<string, { winRate: number; avgProfit: number; totalTrades: number; score: number; }> {
  const performance: Record<string, { winRate: number; avgProfit: number; totalTrades: number; score: number; }> = {};
  
  // Group trades by symbol
  for (const trade of trades) {
    if (!trade.symbol) continue;
    
    if (!performance[trade.symbol]) {
      performance[trade.symbol] = {
        winRate: 0,
        avgProfit: 0,
        totalTrades: 0,
        score: 0
      };
    }
    
    // Add trade to the symbol stats
    performance[trade.symbol].totalTrades += 1;
    
    // Only consider closed trades for profit calculation
    if (trade.status === 'closed' && trade.profitLoss !== undefined) {
      // Update win count
      if (trade.profitLoss > 0) {
        performance[trade.symbol].winRate += 1;
      }
      
      // Update profit sum
      performance[trade.symbol].avgProfit += trade.profitLoss;
    }
  }
  
  // Calculate final metrics
  for (const symbol in performance) {
    const symPerf = performance[symbol];
    
    // Calculate win rate as percentage
    if (symPerf.totalTrades > 0) {
      symPerf.winRate = (symPerf.winRate / symPerf.totalTrades) * 100;
    }
    
    // Calculate average profit per trade
    if (symPerf.totalTrades > 0) {
      symPerf.avgProfit = symPerf.avgProfit / symPerf.totalTrades;
    }
    
    // Calculate score (combines win rate and profit)
    symPerf.score = (symPerf.winRate / 50) * (symPerf.avgProfit > 0 ? (1 + symPerf.avgProfit / 100) : 0.5);
  }
  
  return performance;
}

// Determine current market condition based on various metrics
export function determineMarketCondition(
  recentCandles: any[],
  volatilityIndex?: number,
  trendStrength?: number
): MarketCondition {
  // Default to sideways if we don't have enough data
  if (!recentCandles || recentCandles.length < 20) {
    return 'sideways';
  }
  
  // Calculate simple trend based on recent price action
  const closePrices = recentCandles.map(c => parseFloat(c[4]));
  const firstPrice = closePrices[0];
  const lastPrice = closePrices[closePrices.length - 1];
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  // Calculate volatility (using standard deviation of returns)
  const returns: number[] = [];
  for (let i = 1; i < closePrices.length; i++) {
    returns.push((closePrices[i] - closePrices[i-1]) / closePrices[i-1]);
  }
  
  const avgReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, val) => sum + Math.pow(val - avgReturn, 2), 0) / returns.length
  );
  
  // Annualize volatility
  const annualizedVolatility = stdDev * Math.sqrt(365) * 100;
  
  // Use external volatility index if provided
  const volatility = volatilityIndex || annualizedVolatility;
  
  // Determine market condition
  if (volatility > 80) {
    return 'volatile';
  } else if (priceChange > 5 || (trendStrength && trendStrength > 70)) {
    return 'bullish';
  } else if (priceChange < -5 || (trendStrength && trendStrength < 30)) {
    return 'bearish';
  } else {
    return 'sideways';
  }
}

// Get current model state
export function getAIModel(): AIModel {
  return aiModel;
}

// Export model state as JSON for storage
export function exportAIModel(): string {
  return JSON.stringify(aiModel);
}

// Import model state from JSON
export function importAIModel(modelJson: string): AIModel {
  try {
    aiModel = JSON.parse(modelJson);
    return aiModel;
  } catch (error) {
    console.error('Failed to import AI model:', error);
    return aiModel;
  }
}