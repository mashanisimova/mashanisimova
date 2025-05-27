'use server';

import { getWalletBalance, getPositions } from '@/lib/api/bybit';
import { getCorrelationMatrix } from './correlationAnalysis';
import { getCurrentPrice } from './autoTrader';

// Types for risk management
type Position = {
  symbol: string;
  entryPrice: number;
  size: number;
  side: 'Buy' | 'Sell';
  leverage?: number;
  markPrice?: number;
  pnl?: number;
};

type RiskReport = {
  totalPortfolioValue: number;
  valueAtRisk: {
    daily95: number;  // 95% confidence VaR (1-day)
    daily99: number;  // 99% confidence VaR (1-day)
    weekly95: number; // 95% confidence VaR (7-day)
  };
  expectedShortfall: number; // Expected loss exceeding VaR
  riskMetrics: {
    portfolioVolatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    riskOfRuin: number;
  };
  concentrationRisk: {
    topPosition: string;
    topPositionPct: number;
    diversificationScore: number;
  };
  correlationRisk: {
    highestCorrelation: {
      pair: [string, string];
      value: number;
    };
    avgCorrelation: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  };
  positionLevels: {
    symbol: string;
    riskContribution: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    recommendation: string;
  }[];
  overallRiskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  riskRecommendations: string[];
};

type RiskProfile = {
  maxAcceptableLoss: number; // Maximum acceptable loss as % of portfolio
  targetSharpeRatio: number; // Target Sharpe ratio
  maxConcentration: number;  // Maximum allocation to single asset (%)
  maxDrawdown: number;       // Maximum acceptable drawdown (%)
  maxLeverage: number;       // Maximum acceptable leverage
  volatilityTolerance: 'Low' | 'Medium' | 'High'; // Volatility tolerance
};

// Default risk profile if user hasn't set one
const defaultRiskProfile: RiskProfile = {
  maxAcceptableLoss: 2,     // 2% max daily loss
  targetSharpeRatio: 1.5,   // Target Sharpe ratio of 1.5
  maxConcentration: 20,     // Max 20% in single asset
  maxDrawdown: 15,          // Max 15% drawdown
  maxLeverage: 5,           // Max 5x leverage
  volatilityTolerance: 'Medium'
};

// Historical volatility data (to be calculated from actual data)
const assetVolatility: Record<string, number> = {
  'BTCUSDT': 3.2,   // Daily volatility %
  'ETHUSDT': 4.1,
  'SOLUSDT': 6.8,
  'XRPUSDT': 5.2,
  'DOGEUSDT': 7.4,
  'ADAUSDT': 5.7,
  'BNBUSDT': 3.8,
  'DOTUSDT': 6.3,
  'MATICUSDT': 6.5,
  'LINKUSDT': 5.9
};

// Default volatility if specific asset not found
const DEFAULT_VOLATILITY = 5.0;

/**
 * Calculate comprehensive Value at Risk (VaR) for the current portfolio
 */
export async function calculateValueAtRisk(
  userRiskProfile: RiskProfile = defaultRiskProfile
): Promise<RiskReport> {
  try {
    // Get current positions and wallet balance
    const walletData = await getWalletBalance();
    const positionsData = await getPositions();
    
    if (!walletData || !positionsData) {
      throw new Error('Failed to fetch wallet or positions data');
    }
    
    // Get portfolio value
    const portfolioValue = parseFloat(walletData?.list?.[0]?.totalEquity || '0');
    
    // Format positions
    const positions: Position[] = (positionsData?.list || []).map((pos: any) => ({
      symbol: pos.symbol,
      entryPrice: parseFloat(pos.entryPrice),
      size: parseFloat(pos.size),
      side: pos.side,
      leverage: parseFloat(pos.leverage || '1'),
      markPrice: parseFloat(pos.markPrice),
      pnl: parseFloat(pos.unrealisedPnl || '0')
    }));
    
    // If no positions, return simple report
    if (positions.length === 0) {
      return {
        totalPortfolioValue: portfolioValue,
        valueAtRisk: {
          daily95: 0,
          daily99: 0,
          weekly95: 0
        },
        expectedShortfall: 0,
        riskMetrics: {
          portfolioVolatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          riskOfRuin: 0
        },
        concentrationRisk: {
          topPosition: 'None',
          topPositionPct: 0,
          diversificationScore: 1 // Perfect diversification when no positions
        },
        correlationRisk: {
          highestCorrelation: {
            pair: ['None', 'None'],
            value: 0
          },
          avgCorrelation: 0,
          riskLevel: 'Low'
        },
        positionLevels: [],
        overallRiskLevel: 'Low',
        riskRecommendations: ['No open positions. Portfolio risk is minimal.']
      };
    }
    
    // Get position values
    const positionValues: Record<string, number> = {};
    let totalPositionValue = 0;
    
    for (const position of positions) {
      const value = position.size * (position.markPrice || position.entryPrice);
      positionValues[position.symbol] = value;
      totalPositionValue += value;
    }
    
    // Get correlation matrix for these assets
    const symbols = positions.map(p => p.symbol);
    const correlationMatrix = await getCorrelationMatrix(symbols);
    
    // Calculate portfolio volatility using correlation matrix
    let portfolioVariance = 0;
    
    // Double sum for portfolio variance with correlations
    for (let i = 0; i < symbols.length; i++) {
      const symbolI = symbols[i];
      const weightI = positionValues[symbolI] / totalPositionValue;
      const volI = assetVolatility[symbolI] || DEFAULT_VOLATILITY;
      
      for (let j = 0; j < symbols.length; j++) {
        const symbolJ = symbols[j];
        const weightJ = positionValues[symbolJ] / totalPositionValue;
        const volJ = assetVolatility[symbolJ] || DEFAULT_VOLATILITY;
        
        // Get correlation between assets i and j
        const correlation = i === j ? 1 : (
          correlationMatrix[symbolI]?.[symbolJ] || 
          correlationMatrix[symbolJ]?.[symbolI] || 
          0
        );
        
        portfolioVariance += weightI * weightJ * volI * volJ * correlation;
      }
    }
    
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    // Calculate VaR at different confidence levels
    const z95 = 1.645; // 95% confidence Z-score
    const z99 = 2.326; // 99% confidence Z-score
    
    // Daily VaR
    const daily95 = portfolioValue * portfolioVolatility * z95 / 100;
    const daily99 = portfolioValue * portfolioVolatility * z99 / 100;
    
    // Weekly VaR (approximation using square root of time rule)
    const weekly95 = daily95 * Math.sqrt(7);
    
    // Expected Shortfall (CVaR) - average of losses exceeding VaR
    // Simplified approximation: 1.25 * VaR for normal distributions
    const expectedShortfall = daily95 * 1.25;
    
    // Calculate concentration risk
    let topPosition = 'None';
    let topPositionPct = 0;
    
    for (const symbol in positionValues) {
      const pct = positionValues[symbol] / totalPositionValue * 100;
      if (pct > topPositionPct) {
        topPositionPct = pct;
        topPosition = symbol;
      }
    }
    
    // Calculate diversification score (Herfindahl-Hirschman Index inverse)
    // Higher is better, 1 = perfectly diversified, approaches 0 for concentrated
    let sumSquaredWeights = 0;
    for (const symbol in positionValues) {
      const weight = positionValues[symbol] / totalPositionValue;
      sumSquaredWeights += weight * weight;
    }
    const diversificationScore = 1 / sumSquaredWeights / symbols.length;
    
    // Calculate correlation risk
    let highestCorrelation = 0;
    let highestCorrelationPair: [string, string] = ['None', 'None'];
    let correlationSum = 0;
    let correlationCount = 0;
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbolI = symbols[i];
        const symbolJ = symbols[j];
        
        const correlation = Math.abs(
          correlationMatrix[symbolI]?.[symbolJ] || 
          correlationMatrix[symbolJ]?.[symbolI] || 
          0
        );
        
        correlationSum += correlation;
        correlationCount++;
        
        if (correlation > highestCorrelation) {
          highestCorrelation = correlation;
          highestCorrelationPair = [symbolI, symbolJ];
        }
      }
    }
    
    const avgCorrelation = correlationCount > 0 ? correlationSum / correlationCount : 0;
    const correlationRiskLevel = 
      avgCorrelation > 0.7 ? 'High' : 
      avgCorrelation > 0.4 ? 'Medium' : 'Low';
    
    // Calculate risk metrics
    const assumedRiskFreeRate = 3.0; // Assumed risk-free rate (3%)
    const assumedAnnualReturn = 45.0; // Assumed annual return (45%)
    
    // Sharpe ratio = (Expected Return - Risk Free Rate) / Portfolio Volatility
    const annualizedVolatility = portfolioVolatility * Math.sqrt(365);
    const sharpeRatio = (assumedAnnualReturn - assumedRiskFreeRate) / annualizedVolatility;
    
    // Max drawdown (simplified estimation based on volatility)
    const maxDrawdown = portfolioVolatility * 2.5; // Approximate using 2.5 * daily volatility
    
    // Risk of ruin - probability of losing a specific portion of portfolio
    // Using approximation based on kelly criterion
    const targetLossPercent = 50; // Probability of losing 50% of portfolio
    const dailyWinRate = 0.55; // Assumed win rate
    const riskOfRuin = Math.exp(-2 * dailyWinRate * portfolioValue / (targetLossPercent * portfolioVariance));
    
    // Position-level risk assessments
    const positionLevels = positions.map(position => {
      const symbol = position.symbol;
      const volatility = assetVolatility[symbol] || DEFAULT_VOLATILITY;
      const value = positionValues[symbol];
      const pctOfPortfolio = value / totalPositionValue * 100;
      
      // Risk contribution = position's percentage * position's volatility * leverage
      const leverage = position.leverage || 1;
      const riskContribution = pctOfPortfolio * volatility * leverage / 100;
      
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      let recommendation = '';
      
      if (riskContribution > 1.5) {
        riskLevel = 'High';
        recommendation = `Consider reducing ${symbol} position by ${Math.round((riskContribution - 1.5) / riskContribution * 100)}%`;
      } else if (riskContribution > 0.8) {
        riskLevel = 'Medium';
        recommendation = `Monitor ${symbol} closely, consider partial profit taking`;
      } else {
        recommendation = `${symbol} position is well-sized for your portfolio`;
      }
      
      return {
        symbol,
        riskContribution,
        riskLevel,
        recommendation
      };
    });
    
    // Determine overall risk level
    let overallRiskLevel: 'Low' | 'Medium' | 'High' | 'Extreme' = 'Low';
    
    if (daily95 > portfolioValue * (userRiskProfile.maxAcceptableLoss / 100)) {
      overallRiskLevel = 'Extreme';
    } else if (
      portfolioVolatility > 8 || 
      topPositionPct > userRiskProfile.maxConcentration || 
      avgCorrelation > 0.7
    ) {
      overallRiskLevel = 'High';
    } else if (
      portfolioVolatility > 5 || 
      topPositionPct > userRiskProfile.maxConcentration * 0.7 || 
      avgCorrelation > 0.5
    ) {
      overallRiskLevel = 'Medium';
    }
    
    // Generate risk recommendations
    const riskRecommendations: string[] = [];
    
    if (overallRiskLevel === 'Extreme' || overallRiskLevel === 'High') {
      riskRecommendations.push(`Reduce overall portfolio risk - current daily VaR (${daily95.toFixed(2)} USDT) exceeds your risk tolerance`);
    }
    
    if (topPositionPct > userRiskProfile.maxConcentration) {
      riskRecommendations.push(`Reduce concentration in ${topPosition} from ${topPositionPct.toFixed(1)}% to below ${userRiskProfile.maxConcentration}%`);
    }
    
    if (avgCorrelation > 0.6) {
      riskRecommendations.push(`High asset correlation detected (${avgCorrelation.toFixed(2)}). Add uncorrelated assets to diversify.`);
    }
    
    if (positionLevels.filter(p => p.riskLevel === 'High').length > 0) {
      riskRecommendations.push(`Address high-risk positions: ${positionLevels.filter(p => p.riskLevel === 'High').map(p => p.symbol).join(', ')}`);
    }
    
    if (sharpeRatio < userRiskProfile.targetSharpeRatio) {
      riskRecommendations.push(`Current Sharpe ratio (${sharpeRatio.toFixed(2)}) is below target (${userRiskProfile.targetSharpeRatio}). Consider adjusting strategy.`);
    }
    
    // If everything looks good
    if (riskRecommendations.length === 0) {
      riskRecommendations.push(`Portfolio risk metrics are within your defined limits. Continue monitoring.`);
    }
    
    // Return comprehensive risk report
    return {
      totalPortfolioValue: portfolioValue,
      valueAtRisk: {
        daily95,
        daily99,
        weekly95
      },
      expectedShortfall,
      riskMetrics: {
        portfolioVolatility,
        sharpeRatio,
        maxDrawdown,
        riskOfRuin
      },
      concentrationRisk: {
        topPosition,
        topPositionPct,
        diversificationScore
      },
      correlationRisk: {
        highestCorrelation: {
          pair: highestCorrelationPair,
          value: highestCorrelation
        },
        avgCorrelation,
        riskLevel: correlationRiskLevel
      },
      positionLevels,
      overallRiskLevel,
      riskRecommendations
    };
  } catch (error: any) {
    console.error('Error calculating Value at Risk:', error);
    throw new Error(`Failed to calculate Value at Risk: ${error.message}`);
  }
}

/**
 * Calculate adaptive position size based on volatility and market conditions
 */
export async function calculateAdaptivePositionSize(
  symbol: string,
  accountBalance: number,
  riskPercentage: number,
  marketCondition: 'bullish' | 'bearish' | 'ranging' | 'volatile'
): Promise<number> {
  try {
    // Get current price and volatility
    const currentPrice = await getCurrentPrice(symbol);
    if (!currentPrice) throw new Error(`Failed to get current price for ${symbol}`);
    
    const baseVolatility = assetVolatility[symbol] || DEFAULT_VOLATILITY;
    
    // Adjust volatility based on market condition
    let adjustedVolatility = baseVolatility;
    
    switch (marketCondition) {
      case 'volatile':
        adjustedVolatility = baseVolatility * 1.5; // Increase estimated volatility in volatile markets
        break;
      case 'ranging':
        adjustedVolatility = baseVolatility * 0.8; // Slightly reduce in ranging markets
        break;
      case 'bullish':
        adjustedVolatility = baseVolatility * 0.9; // Slightly reduce in trending markets
        break;
      case 'bearish':
        adjustedVolatility = baseVolatility * 1.1; // Slightly increase in bearish markets
        break;
    }
    
    // Calculate position size using volatility-adjusted formula
    // Base formula: riskAmount / (volatility * price)
    const riskAmount = accountBalance * (riskPercentage / 100);
    const positionSize = riskAmount / (adjustedVolatility * currentPrice / 100);
    
    // Apply additional scaling based on market condition
    let scaledPositionSize = positionSize;
    
    switch (marketCondition) {
      case 'bullish':
        scaledPositionSize = positionSize * 1.2; // Increase position size in bullish markets
        break;
      case 'bearish':
        scaledPositionSize = positionSize * 0.8; // Reduce position size in bearish markets
        break;
      case 'volatile':
        scaledPositionSize = positionSize * 0.7; // Significantly reduce position size in volatile markets
        break;
      // Leave ranging markets as calculated
    }
    
    // Ensure minimum position size
    const minPositionSize = 0.001; // Minimum position size
    return Math.max(scaledPositionSize, minPositionSize);
  } catch (error: any) {
    console.error('Error calculating adaptive position size:', error);
    throw new Error(`Failed to calculate position size: ${error.message}`);
  }
}

/**
 * Analyze and detect overexposed correlations in the portfolio
 */
export async function detectPortfolioCorrelations(): Promise<{
  highlyCorrelated: {pair: [string, string], correlation: number}[];
  recommendations: string[];
}> {
  try {
    // Get current positions
    const positionsData = await getPositions();
    if (!positionsData?.list) {
      return {
        highlyCorrelated: [],
        recommendations: ['No positions found. Portfolio correlation analysis not applicable.']
      };
    }
    
    // Extract symbols from positions
    const symbols = positionsData.list.map((pos: any) => pos.symbol);
    
    // If less than 2 positions, correlation analysis isn't applicable
    if (symbols.length < 2) {
      return {
        highlyCorrelated: [],
        recommendations: ['Less than 2 positions open. Portfolio correlation analysis not applicable.']
      };
    }
    
    // Get correlation matrix
    const correlationMatrix = await getCorrelationMatrix(symbols);
    
    // Identify highly correlated pairs (correlation > 0.7)
    const highlyCorrelated: {pair: [string, string], correlation: number}[] = [];
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const symbolI = symbols[i];
        const symbolJ = symbols[j];
        
        const correlation = Math.abs(
          correlationMatrix[symbolI]?.[symbolJ] || 
          correlationMatrix[symbolJ]?.[symbolI] || 
          0
        );
        
        if (correlation > 0.7) {
          highlyCorrelated.push({
            pair: [symbolI, symbolJ],
            correlation
          });
        }
      }
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (highlyCorrelated.length > 0) {
      recommendations.push(`Found ${highlyCorrelated.length} highly correlated pairs in your portfolio.`);
      
      // Sort by correlation value (highest first)
      highlyCorrelated.sort((a, b) => b.correlation - a.correlation);
      
      // Generate specific recommendations for top 3 correlated pairs
      const topPairs = highlyCorrelated.slice(0, 3);
      
      for (const {pair, correlation} of topPairs) {
        const [symbol1, symbol2] = pair;
        recommendations.push(`${symbol1} and ${symbol2} are ${(correlation * 100).toFixed(1)}% correlated. Consider reducing exposure to one of these assets.`);
      }
      
      // General recommendation for diversification
      recommendations.push('Consider adding uncorrelated assets like stablecoins, commodities, or inverse ETFs to reduce overall portfolio correlation.');
    } else {
      recommendations.push('No high correlations detected in your portfolio. Good diversification!');
    }
    
    return {
      highlyCorrelated,
      recommendations
    };
  } catch (error: any) {
    console.error('Error detecting portfolio correlations:', error);
    throw new Error(`Failed to analyze portfolio correlations: ${error.message}`);
  }
}

/**
 * Get risk profile for user (or use default)
 */
export function getUserRiskProfile(): RiskProfile {
  // In a real implementation, this would fetch from user settings
  return defaultRiskProfile;
}
