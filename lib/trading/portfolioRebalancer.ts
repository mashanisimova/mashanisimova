'use server';

import { BybitCredentials, getWalletBalance, placeOrder, getMarketData } from '../api/bybit';
import { getAIModel } from './aiTrader';

type AssetAllocation = {
  symbol: string;
  targetPercentage: number;
  currentPercentage: number;
  currentValue: number;
  targetValue: number;
  difference: number;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  currentPrice: number;
};

type RebalanceResult = {
  assets: AssetAllocation[];
  totalPortfolioValue: number;
  rebalanceNeeded: boolean;
  recommendedActions: Array<{
    symbol: string;
    action: 'buy' | 'sell' | 'hold';
    quantity: string;
    estimatedValue: number;
  }>;
  lastRebalanced: number;
  volatilityAdjustment: boolean;
  performanceBasedAdjustment: boolean;
};

type RebalanceConfig = {
  assets: Array<{ symbol: string; targetPercentage: number }>;
  rebalanceThreshold: number; // Percentage deviation to trigger rebalance
  safetyBuffer: number; // Percentage to keep in stablecoins for safety
  volatilityAdjustment: boolean; // Adjust allocations based on volatility
  performanceBasedWeights: boolean; // Adjust weights based on performance
  maxSingleAssetPercentage: number; // Cap on any single asset
};

/**
 * Analyzes the current portfolio and generates a rebalance plan
 */
export async function analyzePortfolio(
  config: RebalanceConfig
): Promise<RebalanceResult> {
  try {
    console.log('Analyzing portfolio for rebalance');
    
    // Get current wallet balance
    const walletData = await getWalletBalance();
    if (!walletData || !walletData.list || walletData.list.length === 0) {
      throw new Error('Failed to fetch wallet balance');
    }
    
    // Get market data for pricing
    const marketData: Record<string, number> = {};
    for (const asset of config.assets) {
      const ticker = await getMarketData(asset.symbol);
      if (ticker && ticker.list && ticker.list.length > 0) {
        marketData[asset.symbol] = parseFloat(ticker.list[0].lastPrice);
      }
    }
    
    // Calculate current portfolio value and allocations
    const assets: AssetAllocation[] = [];
    let totalPortfolioValue = 0;
    
    // Add all configured assets
    for (const asset of config.assets) {
      const currentPrice = marketData[asset.symbol] || 0;
      const balance = parseFloat(walletData.list.find(a => a.coin === asset.symbol.replace('USDT', ''))?.free || '0');
      const currentValue = balance * currentPrice;
      totalPortfolioValue += currentValue;
      
      assets.push({
        symbol: asset.symbol,
        targetPercentage: asset.targetPercentage,
        currentPercentage: 0, // Will be calculated later
        currentValue,
        targetValue: 0, // Will be calculated later
        difference: 0, // Will be calculated later
        action: 'hold',
        quantity: 0,
        currentPrice
      });
    }
    
    // Add stablecoin balance (USDT)
    const usdtBalance = parseFloat(walletData.list.find(a => a.coin === 'USDT')?.free || '0');
    totalPortfolioValue += usdtBalance;
    
    // Apply volatility adjustments if enabled
    let adjustedTargets = [...config.assets];
    if (config.volatilityAdjustment) {
      adjustedTargets = await adjustForVolatility(config.assets);
    }
    
    // Apply performance-based adjustments if enabled
    if (config.performanceBasedWeights) {
      adjustedTargets = await adjustForPerformance(adjustedTargets);
    }
    
    // Apply safety buffer - ensure we keep some USDT available
    const bufferPercentage = config.safetyBuffer || 5;
    const remainingPercentage = 100 - bufferPercentage;
    
    // Calculate normalized percentages (accounting for buffer)
    const totalConfiguredPercentage = adjustedTargets.reduce((sum, asset) => sum + asset.targetPercentage, 0);
    const normalizationFactor = remainingPercentage / totalConfiguredPercentage;
    
    // Calculate current percentages and target values
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const adjustedTarget = adjustedTargets.find(a => a.symbol === asset.symbol);
      
      // Apply normalization factor to respect safety buffer
      asset.targetPercentage = (adjustedTarget?.targetPercentage || asset.targetPercentage) * normalizationFactor;
      
      // Enforce maximum single asset percentage if configured
      if (config.maxSingleAssetPercentage && asset.targetPercentage > config.maxSingleAssetPercentage) {
        asset.targetPercentage = config.maxSingleAssetPercentage;
      }
      
      asset.currentPercentage = totalPortfolioValue > 0 ? (asset.currentValue / totalPortfolioValue) * 100 : 0;
      asset.targetValue = (asset.targetPercentage / 100) * totalPortfolioValue;
      asset.difference = asset.targetValue - asset.currentValue;
      
      // Determine action
      if (asset.difference > 0 && Math.abs(asset.difference) > config.rebalanceThreshold / 100 * totalPortfolioValue) {
        asset.action = 'buy';
        asset.quantity = asset.difference / asset.currentPrice;
      } else if (asset.difference < 0 && Math.abs(asset.difference) > config.rebalanceThreshold / 100 * totalPortfolioValue) {
        asset.action = 'sell';
        asset.quantity = Math.abs(asset.difference) / asset.currentPrice;
      } else {
        asset.action = 'hold';
        asset.quantity = 0;
      }
    }
    
    // Generate recommended actions
    const recommendedActions = assets
      .filter(asset => asset.action !== 'hold' && asset.quantity > 0)
      .map(asset => ({
        symbol: asset.symbol,
        action: asset.action,
        quantity: asset.quantity.toFixed(4),
        estimatedValue: Math.abs(asset.difference)
      }));
    
    return {
      assets,
      totalPortfolioValue,
      rebalanceNeeded: recommendedActions.length > 0,
      recommendedActions,
      lastRebalanced: Date.now(),
      volatilityAdjustment: config.volatilityAdjustment,
      performanceBasedAdjustment: config.performanceBasedWeights
    };
  } catch (error) {
    console.error('Error analyzing portfolio:', error);
    throw error;
  }
}

/**
 * Executes portfolio rebalancing based on analysis
 */
export async function executeRebalance(
  result: RebalanceResult
): Promise<{
  success: boolean;
  actions: Array<{ symbol: string; action: string; quantity: string; status: string; }>;
}> {
  try {
    console.log('Executing portfolio rebalance');
    
    const actions: Array<{ symbol: string; action: string; quantity: string; status: string; }> = [];
    
    // Execute sell orders first to ensure we have liquidity for buys
    const sellActions = result.recommendedActions.filter(a => a.action === 'sell');
    for (const action of sellActions) {
      try {
        const orderResult = await placeOrder({
          symbol: action.symbol,
          side: 'Sell',
          orderType: 'Market',
          qty: action.quantity
        });
        
        actions.push({
          symbol: action.symbol,
          action: 'sell',
          quantity: action.quantity,
          status: orderResult?.orderId ? 'success' : 'failed'
        });
      } catch (error) {
        console.error(`Failed to execute sell order for ${action.symbol}:`, error);
        actions.push({
          symbol: action.symbol,
          action: 'sell',
          quantity: action.quantity,
          status: 'failed'
        });
      }
    }
    
    // Wait briefly to ensure sell orders are processed
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute buy orders
    const buyActions = result.recommendedActions.filter(a => a.action === 'buy');
    for (const action of buyActions) {
      try {
        const orderResult = await placeOrder({
          symbol: action.symbol,
          side: 'Buy',
          orderType: 'Market',
          qty: action.quantity
        });
        
        actions.push({
          symbol: action.symbol,
          action: 'buy',
          quantity: action.quantity,
          status: orderResult?.orderId ? 'success' : 'failed'
        });
      } catch (error) {
        console.error(`Failed to execute buy order for ${action.symbol}:`, error);
        actions.push({
          symbol: action.symbol,
          action: 'buy',
          quantity: action.quantity,
          status: 'failed'
        });
      }
    }
    
    return {
      success: actions.every(a => a.status === 'success'),
      actions
    };
  } catch (error) {
    console.error('Error executing rebalance:', error);
    throw error;
  }
}

/**
 * Adjust target allocations based on volatility
 */
async function adjustForVolatility(
  assets: Array<{ symbol: string; targetPercentage: number }>
): Promise<Array<{ symbol: string; targetPercentage: number }>> {
  try {
    // In a real implementation, this would fetch volatility data from an API
    // Here we'll simulate with some realistic volatility values
    const volatilityData: Record<string, number> = {
      'BTCUSDT': 4.5,  // 4.5% daily volatility
      'ETHUSDT': 5.2,  // 5.2% daily volatility
      'SOLUSDT': 8.7,  // 8.7% daily volatility
      'BNBUSDT': 4.8,  // 4.8% daily volatility
      'XRPUSDT': 6.3,  // 6.3% daily volatility
      'ADAUSDT': 7.1,  // 7.1% daily volatility
      'DOGEUSDT': 9.4, // 9.4% daily volatility
    };
    
    // Default volatility for assets not in our data
    const defaultVolatility = 7.0;
    
    // Calculate average volatility
    const avgVolatility = Object.values(volatilityData).reduce((sum, vol) => sum + vol, 0) / Object.values(volatilityData).length;
    
    // Adjust allocations based on volatility
    return assets.map(asset => {
      const volatility = volatilityData[asset.symbol] || defaultVolatility;
      const volatilityRatio = avgVolatility / volatility;
      
      // Higher volatility = lower allocation, but don't adjust too dramatically
      // Use a dampening factor to avoid extreme changes
      const dampening = 0.5;
      const adjustment = (volatilityRatio - 1) * dampening;
      
      // Adjust the target percentage (add or subtract up to 20% of original allocation)
      const adjustedPercentage = asset.targetPercentage * (1 + adjustment);
      
      return {
        symbol: asset.symbol,
        targetPercentage: adjustedPercentage
      };
    });
  } catch (error) {
    console.error('Error adjusting for volatility:', error);
    return assets; // Return original assets if adjustment fails
  }
}

/**
 * Adjust target allocations based on historical performance
 */
async function adjustForPerformance(
  assets: Array<{ symbol: string; targetPercentage: number }>
): Promise<Array<{ symbol: string; targetPercentage: number }>> {
  try {
    // Get AI model weights for symbols
    const aiModel = getAIModel();
    const symbolWeights = aiModel.symbolWeights;
    
    // If we don't have enough performance data, return original allocation
    if (Object.keys(symbolWeights).length < 2) {
      return assets;
    }
    
    // Calculate average weight
    const avgWeight = Object.values(symbolWeights).reduce((sum, w) => sum + w, 0) / Object.values(symbolWeights).length;
    
    // Adjust allocations based on AI model performance weights
    return assets.map(asset => {
      const performanceWeight = symbolWeights[asset.symbol] || avgWeight;
      const performanceRatio = performanceWeight / avgWeight;
      
      // Use a dampening factor to avoid extreme changes
      const dampening = 0.3;
      const adjustment = (performanceRatio - 1) * dampening;
      
      // Adjust the target percentage
      const adjustedPercentage = asset.targetPercentage * (1 + adjustment);
      
      return {
        symbol: asset.symbol,
        targetPercentage: adjustedPercentage
      };
    });
  } catch (error) {
    console.error('Error adjusting for performance:', error);
    return assets; // Return original assets if adjustment fails
  }
}