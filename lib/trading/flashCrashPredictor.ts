/**
 * Flash Crash Predictor Module
 * 
 * This module uses machine learning and pattern recognition to detect
 * conditions that historically preceded flash crashes or significant
 * market corrections, helping traders prepare for sudden downside moves.
 */

export interface MarketCondition {
  liquidityDepth: number; // 0-100 scale
  volatility: number; // 0-100 scale
  fundingRates: number; // Normalized funding rates (-100 to 100)
  openInterestChange: number; // Percent change in last 24h
  volumeSpike: number; // Volume relative to average (1.0 = normal)
  longShortRatio: number; // >1 = more longs, <1 = more shorts
  largeWalletActivity: number; // 0-100 scale of significant wallet movements
  optionsSkew: number; // Put/call ratio normalized (-100 to 100)
  technicalOverextension: number; // 0-100 scale
  newsEventRisk: number; // 0-100 scale
}

export interface FlashCrashRisk {
  overallRisk: number; // 0-100 scale
  timeframe: 'immediate' | 'hours' | 'days' | 'week';
  confidenceScore: number; // 0-100 scale
  riskFactors: {
    factor: string;
    contribution: number; // 0-100 scale
    description: string;
  }[];
  historicalPattern: {
    similarityScore: number; // 0-100 scale
    previousEvents: string[];
    averageDrawdown: number; // Typical % drop in similar conditions
  };
  recommendedActions: string[];
}

/**
 * Analyzes current market conditions to detect flash crash risk
 * @param symbol The trading pair to analyze (e.g., "BTCUSDT")
 * @returns Detailed flash crash risk assessment
 */
export async function predictFlashCrashRisk(symbol: string): Promise<FlashCrashRisk> {
  console.log(`Predicting flash crash risk for ${symbol}`);
  
  // In a real implementation, this would fetch real-time market data
  // and use ML models trained on historical flash crashes
  
  // Simulated market conditions for the trading bot
  // These values would normally come from real-time data
  const marketCondition: MarketCondition = {
    liquidityDepth: 68, // Moderate liquidity
    volatility: 42, // Medium volatility
    fundingRates: 32, // Positive funding (longs paying shorts)
    openInterestChange: 15.8, // Significant increase in open interest
    volumeSpike: 1.35, // Volume 35% above normal
    longShortRatio: 1.28, // More longs than shorts
    largeWalletActivity: 76, // High whale activity
    optionsSkew: 28, // More calls than puts
    technicalOverextension: 82, // Significantly overbought
    newsEventRisk: 45, // Moderate news risk
  };
  
  // Calculate risk factors based on market conditions
  const riskFactors = calculateRiskFactors(marketCondition);
  
  // Calculate overall risk
  const overallRisk = calculateOverallRisk(riskFactors);
  
  // Determine timeframe of risk
  const timeframe = determineRiskTimeframe(marketCondition, overallRisk);
  
  // Find historical patterns similar to current conditions
  const historicalPattern = findSimilarHistoricalPatterns(marketCondition, symbol);
  
  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(overallRisk, timeframe, historicalPattern);
  
  // Calculate confidence score
  const confidenceScore = calculateConfidenceScore(marketCondition, historicalPattern);
  
  return {
    overallRisk,
    timeframe,
    confidenceScore,
    riskFactors,
    historicalPattern,
    recommendedActions,
  };
}

/**
 * Calculate individual risk factors from market conditions
 */
function calculateRiskFactors(conditions: MarketCondition) {
  const riskFactors = [
    {
      factor: 'Liquidity Risk',
      contribution: 100 - conditions.liquidityDepth,
      description: 'Low market depth increases flash crash vulnerability'
    },
    {
      factor: 'Funding Rate Pressure',
      contribution: conditions.fundingRates > 0 ? conditions.fundingRates : 0,
      description: 'High positive funding creates potential for long squeeze'
    },
    {
      factor: 'Long-Short Imbalance',
      contribution: conditions.longShortRatio > 1.2 ? 
        ((conditions.longShortRatio - 1) * 50) : 
        (conditions.longShortRatio < 0.8 ? ((1 - conditions.longShortRatio) * 30) : 0),
      description: conditions.longShortRatio > 1 ? 
        'Market heavily skewed towards longs, potential for cascade liquidations' : 
        'Market heavily skewed towards shorts, potential for short squeeze'
    },
    {
      factor: 'Technical Overextension',
      contribution: conditions.technicalOverextension,
      description: 'Market significantly overbought on technical indicators'
    },
    {
      factor: 'Whale Activity',
      contribution: conditions.largeWalletActivity,
      description: 'Unusual activity from large wallet holders'
    },
    {
      factor: 'Open Interest Surge',
      contribution: conditions.openInterestChange > 10 ? 
        (conditions.openInterestChange * 2) : 0,
      description: 'Rapid increase in futures open interest'
    },
    {
      factor: 'Volatility Risk',
      contribution: conditions.volatility,
      description: 'Elevated market volatility'
    },
    {
      factor: 'Volume Anomaly',
      contribution: conditions.volumeSpike > 1.5 ? 
        ((conditions.volumeSpike - 1) * 40) : 0,
      description: 'Unusual volume patterns'
    },
    {
      factor: 'Options Market Skew',
      contribution: Math.abs(conditions.optionsSkew),
      description: conditions.optionsSkew > 0 ? 
        'Call options dominating, potential for gamma squeeze' : 
        'Put options dominating, reflecting hedging activity'
    },
    {
      factor: 'Event Risk',
      contribution: conditions.newsEventRisk,
      description: 'Potential market-moving events anticipated'
    },
  ];
  
  // Sort by contribution (highest first)
  return riskFactors.sort((a, b) => b.contribution - a.contribution);
}

/**
 * Calculate the overall flash crash risk
 */
function calculateOverallRisk(riskFactors: { factor: string; contribution: number; description: string }[]) {
  // Weight the top 5 risk factors more heavily
  const topFactorsWeight = 0.7;
  const remainingFactorsWeight = 0.3;
  
  const topFactors = riskFactors.slice(0, 5);
  const remainingFactors = riskFactors.slice(5);
  
  const topFactorsRisk = topFactors.reduce((sum, factor) => sum + factor.contribution, 0) / topFactors.length;
  const remainingFactorsRisk = remainingFactors.length > 0 ? 
    remainingFactors.reduce((sum, factor) => sum + factor.contribution, 0) / remainingFactors.length : 
    0;
  
  const weightedRisk = (topFactorsRisk * topFactorsWeight) + 
    (remainingFactorsRisk * remainingFactorsWeight);
  
  return Math.min(100, Math.round(weightedRisk));
}

/**
 * Determine the timeframe for the predicted risk
 */
function determineRiskTimeframe(
  conditions: MarketCondition, 
  overallRisk: number
): 'immediate' | 'hours' | 'days' | 'week' {
  if (overallRisk > 80 && 
      conditions.volumeSpike > 1.8 && 
      conditions.liquidityDepth < 30) {
    return 'immediate';
  }
  
  if (overallRisk > 65 && 
      conditions.fundingRates > 50 && 
      conditions.technicalOverextension > 70) {
    return 'hours';
  }
  
  if (overallRisk > 50 && 
      conditions.openInterestChange > 20) {
    return 'days';
  }
  
  return 'week';
}

/**
 * Find historical patterns that match current conditions
 */
function findSimilarHistoricalPatterns(
  conditions: MarketCondition, 
  symbol: string
) {
  // This would normally query a database of historical patterns
  // For the mock implementation, we'll return simulated data
  
  const overextended = conditions.technicalOverextension > 75;
  const highFunding = conditions.fundingRates > 30;
  const highOpenInterest = conditions.openInterestChange > 15;
  const longImbalance = conditions.longShortRatio > 1.2;
  
  let similarityScore = 0;
  let previousEvents: string[] = [];
  let averageDrawdown = 0;
  
  if (symbol === 'BTCUSDT') {
    if (overextended && highFunding && longImbalance) {
      similarityScore = 87;
      previousEvents = [
        'May 19, 2021: -53% crash over 1 week',
        'January 21, 2022: -46% over 3 weeks',
        'November 8, 2022: -27% over 2 days',
      ];
      averageDrawdown = 42;
    } else if (overextended && highOpenInterest) {
      similarityScore = 72;
      previousEvents = [
        'February 22, 2021: -25% over 2 days',
        'April 17, 2021: -27% over 3 days',
        'December 3, 2021: -35% over 1 week',
      ];
      averageDrawdown = 29;
    } else {
      similarityScore = 45;
      previousEvents = [
        'September 2, 2020: -20% over 2 days',
        'March 14, 2020: -38% in 1 day',
      ];
      averageDrawdown = 28;
    }
  } else if (symbol === 'ETHUSDT') {
    if (overextended && highFunding && longImbalance) {
      similarityScore = 82;
      previousEvents = [
        'May 19, 2021: -60% over 1 week',
        'January 22, 2022: -55% over 3 weeks',
      ];
      averageDrawdown = 58;
    } else {
      similarityScore = 52;
      previousEvents = [
        'February 22, 2021: -36% over 3 days',
        'December 3, 2021: -38% over 1 week',
      ];
      averageDrawdown = 37;
    }
  } else {
    // Default for other symbols
    similarityScore = 38;
    previousEvents = [
      'May 19, 2021: Market-wide correction',
      'January 21, 2022: Market-wide correction',
    ];
    averageDrawdown = 25;
  }
  
  return {
    similarityScore,
    previousEvents,
    averageDrawdown
  };
}

/**
 * Generate recommended actions based on risk assessment
 */
function generateRecommendedActions(
  overallRisk: number, 
  timeframe: 'immediate' | 'hours' | 'days' | 'week',
  historicalPattern: { similarityScore: number; previousEvents: string[]; averageDrawdown: number }
) {
  const actions: string[] = [];
  
  if (overallRisk > 75) {
    actions.push('Reduce position sizes by 50-75%');
    actions.push('Set tight stop losses at key support levels');
    actions.push('Prepare for potential -30% or greater drawdown');
    
    if (timeframe === 'immediate') {
      actions.push('Consider immediate de-risking or hedging');
    }
  } else if (overallRisk > 50) {
    actions.push('Reduce position sizes by 25-50%');
    actions.push('Set stop losses below key support levels');
    actions.push(`Prepare for potential -${historicalPattern.averageDrawdown}% drawdown`);
  } else if (overallRisk > 30) {
    actions.push('Consider reducing high-leverage positions');
    actions.push('Ensure stop losses are in place');
    actions.push('Watch for key technical breakdown signals');
  } else {
    actions.push('Normal risk management procedures sufficient');
    actions.push('Continue monitoring key risk indicators');
  }
  
  return actions;
}

/**
 * Calculate confidence score for the prediction
 */
function calculateConfidenceScore(
  conditions: MarketCondition,
  historicalPattern: { similarityScore: number; previousEvents: string[]; averageDrawdown: number }
) {
  // Base confidence on historical pattern similarity
  let confidence = historicalPattern.similarityScore * 0.6;
  
  // Adjust based on number of identified historical events
  confidence += Math.min(30, historicalPattern.previousEvents.length * 10);
  
  // Adjust based on market condition extremes
  const extremeFactors = [
    conditions.liquidityDepth < 30,
    conditions.volatility > 70,
    conditions.fundingRates > 50,
    conditions.openInterestChange > 25,
    conditions.volumeSpike > 1.8,
    conditions.longShortRatio > 1.5 || conditions.longShortRatio < 0.5,
    conditions.largeWalletActivity > 80,
    conditions.technicalOverextension > 80,
    conditions.newsEventRisk > 70
  ].filter(Boolean).length;
  
  confidence += extremeFactors * 5;
  
  return Math.min(100, Math.round(confidence));
}

/**
 * Get flash crash signal for trading decisions
 * @param symbol The trading pair to analyze
 * @returns Signal strength and confidence
 */
export async function getFlashCrashSignal(symbol: string): Promise<{
  signal: number; // -100 to 100, negative indicating crash risk
  confidence: number; // 0 to 100
  timeframe: 'immediate' | 'hours' | 'days' | 'week';
  expectedDrawdown: number; // Estimated percentage drop
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  primaryFactors: string[];
}> {
  try {
    const riskAssessment = await predictFlashCrashRisk(symbol);
    
    // Convert risk to signal (-100 to 0 range, where -100 is extreme crash risk)
    const signal = -Math.min(100, riskAssessment.overallRisk);
    
    // Determine risk level category
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    if (riskAssessment.overallRisk > 75) {
      riskLevel = 'extreme';
    } else if (riskAssessment.overallRisk > 50) {
      riskLevel = 'high';
    } else if (riskAssessment.overallRisk > 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // Extract top risk factors
    const primaryFactors = riskAssessment.riskFactors
      .slice(0, 3) // Top 3 factors
      .map(factor => factor.factor);
    
    return {
      signal,
      confidence: riskAssessment.confidenceScore,
      timeframe: riskAssessment.timeframe,
      expectedDrawdown: riskAssessment.historicalPattern.averageDrawdown,
      riskLevel,
      primaryFactors
    };
  } catch (error) {
    console.error('Error in flash crash signal generation:', error);
    return {
      signal: 0,
      confidence: 0,
      timeframe: 'week',
      expectedDrawdown: 0,
      riskLevel: 'low',
      primaryFactors: []
    };
  }
}
