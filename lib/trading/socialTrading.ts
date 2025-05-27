'use server';

import { TradeRecord } from './autoTrader';
import crypto from 'crypto';

// Types for social trading
type SharedStrategy = {
  id: string;
  name: string;
  description: string;
  author: string; // Anonymous identifier
  timestamp: number;
  createdAt: string;
  strategies: string[];
  timeframes: string[];
  symbols: string[];
  riskProfile: 'Low' | 'Medium' | 'High';
  performance: {
    winRate: number;
    totalTrades: number;
    profitFactor: number;
    sharpeRatio: number;
    maxDrawdown: number;
    avgReturn: number;
    volatility: number;
  };
  parameters: Record<string, any>;
  feedback: {
    rating: number; // 1-5 stars
    count: number; // Number of ratings
    comments: {
      author: string; // Anonymous identifier
      text: string;
      rating: number;
      timestamp: number;
    }[];
  };
  verified: boolean; // Whether performance has been verified
  popularity: number; // Popularity score
  tags: string[];
};

type StrategyFilter = {
  timeframe?: string;
  symbol?: string;
  minWinRate?: number;
  maxDrawdown?: number;
  minTrades?: number;
  riskProfile?: 'Low' | 'Medium' | 'High';
  sortBy?: 'winRate' | 'profitFactor' | 'sharpeRatio' | 'popularity' | 'rating';
  sortDirection?: 'asc' | 'desc';
};

// Sample strategies database
let sharedStrategies: SharedStrategy[] = [
  {
    id: 'strat-001',
    name: 'Mean Reversion Plus',
    description: 'Advanced mean reversion strategy using Bollinger Bands and RSI for optimal entry and exit points.',
    author: 'trader_7842',
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    strategies: ['MeanReversion', 'RSI Divergence', 'Bollinger Squeeze'],
    timeframes: ['15', '60', '240'],
    symbols: ['BTCUSDT', 'ETHUSDT'],
    riskProfile: 'Medium',
    performance: {
      winRate: 68.5,
      totalTrades: 124,
      profitFactor: 1.85,
      sharpeRatio: 1.92,
      maxDrawdown: 12.4,
      avgReturn: 0.87,
      volatility: 4.2
    },
    parameters: {
      rsiPeriod: 14,
      rsiOversold: 30,
      rsiOverbought: 70,
      bollingerPeriod: 20,
      bollingerDeviation: 2
    },
    feedback: {
      rating: 4.2,
      count: 18,
      comments: [
        {
          author: 'crypto_enthusiast',
          text: 'Great strategy for ranging markets. Performed exactly as described.',
          rating: 5,
          timestamp: Date.now() - 15 * 24 * 60 * 60 * 1000
        },
        {
          author: 'btc_hodler',
          text: 'Good, but struggled during the recent volatility.',
          rating: 3,
          timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000
        }
      ]
    },
    verified: true,
    popularity: 87,
    tags: ['mean reversion', 'oscillators', 'momentum']
  },
  {
    id: 'strat-002',
    name: 'Trend Surfer',
    description: 'Trend-following strategy combining EMA crossovers with ADX for trend confirmation and Supertrend for exit signals.',
    author: 'algotrader_2834',
    timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    strategies: ['EMA Crossover', 'ADX Trend', 'Supertrend'],
    timeframes: ['60', '240', 'D'],
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
    riskProfile: 'Medium',
    performance: {
      winRate: 58.2,
      totalTrades: 189,
      profitFactor: 2.15,
      sharpeRatio: 2.04,
      maxDrawdown: 18.7,
      avgReturn: 1.25,
      volatility: 6.8
    },
    parameters: {
      fastEMA: 8,
      slowEMA: 21,
      adxPeriod: 14,
      adxThreshold: 25,
      supertrendFactor: 3,
      supertrendPeriod: 10
    },
    feedback: {
      rating: 4.5,
      count: 32,
      comments: [
        {
          author: 'eth_trader',
          text: 'Excellent in trending markets. Made significant profits during the last bull run.',
          rating: 5,
          timestamp: Date.now() - 25 * 24 * 60 * 60 * 1000
        },
        {
          author: 'daytrader99',
          text: 'Works great but needs manual intervention during sideways markets.',
          rating: 4,
          timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000
        }
      ]
    },
    verified: true,
    popularity: 124,
    tags: ['trend following', 'ema', 'adx']
  },
  {
    id: 'strat-003',
    name: 'Volatility Breakout Hunter',
    description: 'Targets volatility breakouts using Bollinger Bands, ATR, and volume confirmation for high probability entries.',
    author: 'volatility_master',
    timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    strategies: ['Bollinger Squeeze', 'Volume Spike', 'Breakout'],
    timeframes: ['15', '60'],
    symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'],
    riskProfile: 'High',
    performance: {
      winRate: 52.8,
      totalTrades: 215,
      profitFactor: 1.95,
      sharpeRatio: 1.78,
      maxDrawdown: 22.5,
      avgReturn: 1.85,
      volatility: 8.4
    },
    parameters: {
      bollingerPeriod: 20,
      bollingerDeviation: 2.5,
      atrPeriod: 14,
      atrMultiplier: 1.5,
      volumeThreshold: 200
    },
    feedback: {
      rating: 4.1,
      count: 24,
      comments: [
        {
          author: 'volatility_surfer',
          text: 'High risk but high reward. Perfect for catching major breakouts.',
          rating: 5,
          timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000
        },
        {
          author: 'risk_averse_trader',
          text: 'Too aggressive for my taste but performs well when market is volatile.',
          rating: 3,
          timestamp: Date.now() - 8 * 24 * 60 * 60 * 1000
        }
      ]
    },
    verified: true,
    popularity: 92,
    tags: ['volatility', 'breakout', 'volume']
  }
];

/**
 * Share a trading strategy anonymously
 */
export async function shareStrategy(
  name: string,
  description: string,
  strategies: string[],
  timeframes: string[],
  symbols: string[],
  parameters: Record<string, any>,
  tradeHistory: TradeRecord[],
  riskProfile: 'Low' | 'Medium' | 'High'
): Promise<{ success: boolean; strategyId?: string; error?: string }> {
  try {
    // Generate anonymous identifier based on provided information
    const userIdentifier = crypto
      .createHash('sha256')
      .update(`${name}${Date.now()}${Math.random()}`)
      .digest('hex')
      .substring(0, 10);
    
    // Calculate performance metrics based on trade history
    const closedTrades = tradeHistory.filter(t => t.status === 'closed' && t.profitLoss !== undefined);
    
    if (closedTrades.length < 10) {
      return { 
        success: false, 
        error: 'Not enough trade history to share strategy. Minimum 10 completed trades required.' 
      };
    }
    
    const winningTrades = closedTrades.filter(t => (t.profitLoss || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.profitLoss || 0) <= 0);
    
    const winRate = (winningTrades.length / closedTrades.length) * 100;
    
    // Calculate profit factor (gross profit / gross loss)
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Calculate returns for Sharpe ratio
    const returns = closedTrades.map(trade => {
      if (!trade.profitLoss || !trade.entryPrice) return 0;
      return (trade.profitLoss / (trade.entryPrice * parseFloat(trade.size))) * 100;
    });
    
    // Calculate average return and volatility
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Calculate Sharpe ratio (assuming risk-free rate of 0% for simplicity)
    const sharpeRatio = avgReturn / volatility;
    
    // Calculate maximum drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let equity = 1000; // Starting with $1000
    
    closedTrades.forEach(trade => {
      equity += trade.profitLoss || 0;
      if (equity > peak) peak = equity;
      const drawdown = (peak - equity) / peak * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Generate unique ID for the strategy
    const strategyId = `strat-${crypto.randomBytes(4).toString('hex')}`;
    
    // Create strategy object
    const newStrategy: SharedStrategy = {
      id: strategyId,
      name,
      description,
      author: userIdentifier,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      strategies,
      timeframes,
      symbols,
      riskProfile,
      performance: {
        winRate,
        totalTrades: closedTrades.length,
        profitFactor,
        sharpeRatio,
        maxDrawdown,
        avgReturn,
        volatility
      },
      parameters,
      feedback: {
        rating: 0,
        count: 0,
        comments: []
      },
      verified: false, // Initially not verified, would be verified by system
      popularity: 0,
      tags: strategies.map(s => s.toLowerCase())
    };
    
    // Add to shared strategies database
    sharedStrategies.push(newStrategy);
    
    return { success: true, strategyId };
  } catch (error: any) {
    console.error('Error sharing strategy:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get list of shared strategies with filtering
 */
export async function getSharedStrategies(
  filter?: StrategyFilter
): Promise<SharedStrategy[]> {
  // Apply filters
  let filteredStrategies = [...sharedStrategies];
  
  if (filter) {
    if (filter.timeframe) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.timeframes.includes(filter.timeframe!)
      );
    }
    
    if (filter.symbol) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.symbols.includes(filter.symbol!)
      );
    }
    
    if (filter.minWinRate) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.performance.winRate >= filter.minWinRate!
      );
    }
    
    if (filter.maxDrawdown) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.performance.maxDrawdown <= filter.maxDrawdown!
      );
    }
    
    if (filter.minTrades) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.performance.totalTrades >= filter.minTrades!
      );
    }
    
    if (filter.riskProfile) {
      filteredStrategies = filteredStrategies.filter(s => 
        s.riskProfile === filter.riskProfile
      );
    }
    
    // Apply sorting
    if (filter.sortBy) {
      filteredStrategies.sort((a, b) => {
        let valueA: number, valueB: number;
        
        switch (filter.sortBy) {
          case 'winRate':
            valueA = a.performance.winRate;
            valueB = b.performance.winRate;
            break;
          case 'profitFactor':
            valueA = a.performance.profitFactor;
            valueB = b.performance.profitFactor;
            break;
          case 'sharpeRatio':
            valueA = a.performance.sharpeRatio;
            valueB = b.performance.sharpeRatio;
            break;
          case 'popularity':
            valueA = a.popularity;
            valueB = b.popularity;
            break;
          case 'rating':
            valueA = a.feedback.rating;
            valueB = b.feedback.rating;
            break;
          default:
            valueA = a.performance.winRate;
            valueB = b.performance.winRate;
        }
        
        return filter.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      });
    }
  }
  
  return filteredStrategies;
}

/**
 * Get detailed information about a specific strategy
 */
export async function getStrategyDetails(strategyId: string): Promise<SharedStrategy | null> {
  const strategy = sharedStrategies.find(s => s.id === strategyId);
  return strategy || null;
}

/**
 * Rate and comment on a shared strategy
 */
export async function rateStrategy(
  strategyId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find strategy
    const strategyIndex = sharedStrategies.findIndex(s => s.id === strategyId);
    
    if (strategyIndex === -1) {
      return { success: false, error: 'Strategy not found' };
    }
    
    // Generate anonymous user identifier
    const userIdentifier = crypto
      .createHash('sha256')
      .update(`${strategyId}${Date.now()}${Math.random()}`)
      .digest('hex')
      .substring(0, 12);
    
    // Add rating
    const strategy = sharedStrategies[strategyIndex];
    
    // Update average rating
    const totalRatingPoints = strategy.feedback.rating * strategy.feedback.count;
    const newCount = strategy.feedback.count + 1;
    const newRating = (totalRatingPoints + rating) / newCount;
    
    strategy.feedback.rating = newRating;
    strategy.feedback.count = newCount;
    
    // Add comment if provided
    if (comment) {
      strategy.feedback.comments.push({
        author: userIdentifier,
        text: comment,
        rating,
        timestamp: Date.now()
      });
    }
    
    // Update strategy
    sharedStrategies[strategyIndex] = strategy;
    
    return { success: true };
  } catch (error: any) {
    console.error('Error rating strategy:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Import a shared strategy into the user's bot
 */
export async function importStrategy(
  strategyId: string
): Promise<{ success: boolean; strategy?: Record<string, any>; error?: string }> {
  try {
    // Find strategy
    const strategy = sharedStrategies.find(s => s.id === strategyId);
    
    if (!strategy) {
      return { success: false, error: 'Strategy not found' };
    }
    
    // Increment popularity counter
    strategy.popularity += 1;
    
    // Format strategy for bot integration
    const formattedStrategy = {
      name: strategy.name,
      description: strategy.description,
      strategies: strategy.strategies,
      timeframes: strategy.timeframes,
      symbols: strategy.symbols,
      parameters: strategy.parameters,
      riskProfile: strategy.riskProfile
    };
    
    return { success: true, strategy: formattedStrategy };
  } catch (error: any) {
    console.error('Error importing strategy:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get leaderboard of top strategies
 */
export async function getStrategyLeaderboard(
  metric: 'winRate' | 'profitFactor' | 'sharpeRatio' | 'popularity' = 'sharpeRatio',
  limit: number = 10
): Promise<SharedStrategy[]> {
  let sortedStrategies: SharedStrategy[] = [];
  
  switch (metric) {
    case 'winRate':
      sortedStrategies = [...sharedStrategies].sort((a, b) => b.performance.winRate - a.performance.winRate);
      break;
    case 'profitFactor':
      sortedStrategies = [...sharedStrategies].sort((a, b) => b.performance.profitFactor - a.performance.profitFactor);
      break;
    case 'sharpeRatio':
      sortedStrategies = [...sharedStrategies].sort((a, b) => b.performance.sharpeRatio - a.performance.sharpeRatio);
      break;
    case 'popularity':
      sortedStrategies = [...sharedStrategies].sort((a, b) => b.popularity - a.popularity);
      break;
  }
  
  return sortedStrategies.slice(0, limit);
}
