/**
 * Tokenomics Health Scoring Module
 * 
 * This module analyzes the economic structure and health of cryptocurrency tokens,
 * providing comprehensive scoring to predict long-term viability and stability.
 */

export interface TokenDistribution {
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null; // null for unlimited supply tokens
  teamAllocation: number; // percentage
  vestingSchedule: {
    teamVesting: boolean;
    vestingPeriod: number; // in months
    vestingCliff: number; // in months
    nextUnlockDate?: number; // timestamp
    nextUnlockAmount?: number; // tokens
  };
  topHolders: {
    top10Percentage: number;
    top50Percentage: number;
    top100Percentage: number;
  };
  exchangeHoldings: number; // percentage on exchanges
}

export interface TokenInflation {
  annualInflation: number; // percentage
  emissionSchedule: {
    currentEmission: number; // tokens per day
    emissionChange: 'increasing' | 'decreasing' | 'stable';
    emissionReductionEvents: {
      date: number; // timestamp
      reductionPercentage: number;
    }[];
  };
  burningMechanism: boolean;
  stakingRatio: number; // percentage of supply staked
}

export interface UtilityMetrics {
  transactionCount: number; // daily average
  activeAddresses: number; // daily average
  feesGenerated: number; // in USD, daily average
  utilityScore: number; // 0-100
  realWorldAdoption: number; // 0-100
  dAppsTVL?: number; // Total Value Locked in DApps, in USD
  interoperability: number; // 0-100
}

export interface GovernanceModel {
  type: 'centralized' | 'dao' | 'hybrid' | 'other';
  votingMechanism?: string;
  proposalSuccessRate?: number;
  voterParticipation?: number; // percentage
  governanceScore: number; // 0-100
  controlConcentration: number; // 0-100, higher means more concentrated
}

export interface TokenHealth {
  token: string;
  category: 'layer1' | 'layer2' | 'defi' | 'exchange' | 'metaverse' | 'privacy' | 'other';
  distribution: TokenDistribution;
  inflation: TokenInflation;
  utility: UtilityMetrics;
  governance: GovernanceModel;
  liquidityDepth: {
    usdLiquidity: number;
    slippageImpact: number; // % price impact for $1M trade
    liquidityScore: number; // 0-100
  };
  economicAlignmentScore: number; // 0-100
  sustainabilityScore: number; // 0-100
  overallHealthScore: number; // 0-100
  riskFactors: string[];
  bullishFactors: string[];
}

// Sample token health data (for demonstration)
const tokenHealthData: Record<string, TokenHealth> = {
  'BTC': {
    token: 'BTC',
    category: 'layer1',
    distribution: {
      circulatingSupply: 19460000,
      totalSupply: 19460000,
      maxSupply: 21000000,
      teamAllocation: 0, // Satoshi's original coins not counted as team allocation
      vestingSchedule: {
        teamVesting: false,
        vestingPeriod: 0,
        vestingCliff: 0
      },
      topHolders: {
        top10Percentage: 5.1,
        top50Percentage: 12.7,
        top100Percentage: 19.3
      },
      exchangeHoldings: 11.8
    },
    inflation: {
      annualInflation: 0.82,
      emissionSchedule: {
        currentEmission: 450, // 900 BTC per day ÷ 2 (after halving)
        emissionChange: 'decreasing',
        emissionReductionEvents: [
          {
            date: new Date('2024-04-20').getTime(),
            reductionPercentage: 50
          },
          {
            date: new Date('2028-04-20').getTime(),
            reductionPercentage: 50
          }
        ]
      },
      burningMechanism: false,
      stakingRatio: 0 // No native staking
    },
    utility: {
      transactionCount: 340000,
      activeAddresses: 1200000,
      feesGenerated: 1500000,
      utilityScore: 92,
      realWorldAdoption: 85,
      interoperability: 70
    },
    governance: {
      type: 'other', // BTC uses UASF (User Activated Soft Forks)
      governanceScore: 75,
      controlConcentration: 25
    },
    liquidityDepth: {
      usdLiquidity: 5800000000,
      slippageImpact: 0.4,
      liquidityScore: 98
    },
    economicAlignmentScore: 93,
    sustainabilityScore: 90,
    overallHealthScore: 94,
    riskFactors: [
      'Energy consumption concerns',
      'Regulatory uncertainty in some jurisdictions',
      'Limited smart contract functionality'
    ],
    bullishFactors: [
      'Fixed supply cap',
      'Decreasing emission schedule',
      'Strong network effect',
      'Institutional adoption',
      'Store of value narrative'
    ]
  },
  'ETH': {
    token: 'ETH',
    category: 'layer1',
    distribution: {
      circulatingSupply: 120250000,
      totalSupply: 120250000,
      maxSupply: null, // no fixed cap, but post-merge inflation is very low
      teamAllocation: 0.2, // Ethereum Foundation
      vestingSchedule: {
        teamVesting: true,
        vestingPeriod: 48,
        vestingCliff: 12
      },
      topHolders: {
        top10Percentage: 10.2,
        top50Percentage: 22.5,
        top100Percentage: 32.7
      },
      exchangeHoldings: 15.3
    },
    inflation: {
      annualInflation: 0.2, // Post-merge deflationary during high usage
      emissionSchedule: {
        currentEmission: 1300, // ETH per day (post-merge)
        emissionChange: 'decreasing',
        emissionReductionEvents: []
      },
      burningMechanism: true,
      stakingRatio: 25.7
    },
    utility: {
      transactionCount: 1200000,
      activeAddresses: 650000,
      feesGenerated: 3500000,
      utilityScore: 97,
      realWorldAdoption: 80,
      dAppsTVL: 32000000000,
      interoperability: 90
    },
    governance: {
      type: 'hybrid',
      votingMechanism: 'EIP process + core dev consensus',
      governanceScore: 82,
      controlConcentration: 35
    },
    liquidityDepth: {
      usdLiquidity: 3500000000,
      slippageImpact: 0.6,
      liquidityScore: 95
    },
    economicAlignmentScore: 88,
    sustainabilityScore: 85,
    overallHealthScore: 90,
    riskFactors: [
      'Execution risk for roadmap',
      'Layer 2 competition',
      'Fee volatility'
    ],
    bullishFactors: [
      'EIP-1559 burning mechanism',
      'Proof-of-stake efficiency',
      'Leading smart contract platform',
      'Strong developer ecosystem',
      'DeFi and NFT adoption'
    ]
  },
  'SOL': {
    token: 'SOL',
    category: 'layer1',
    distribution: {
      circulatingSupply: 432000000,
      totalSupply: 540000000,
      maxSupply: null,
      teamAllocation: 15.6,
      vestingSchedule: {
        teamVesting: true,
        vestingPeriod: 36,
        vestingCliff: 6,
        nextUnlockDate: new Date('2024-06-15').getTime(),
        nextUnlockAmount: 7500000
      },
      topHolders: {
        top10Percentage: 28.5,
        top50Percentage: 45.3,
        top100Percentage: 58.2
      },
      exchangeHoldings: 8.7
    },
    inflation: {
      annualInflation: 5.4,
      emissionSchedule: {
        currentEmission: 65000,
        emissionChange: 'decreasing',
        emissionReductionEvents: [
          {
            date: new Date('2024-09-01').getTime(),
            reductionPercentage: 15
          }
        ]
      },
      burningMechanism: false,
      stakingRatio: 69.4
    },
    utility: {
      transactionCount: 32000000,
      activeAddresses: 290000,
      feesGenerated: 210000,
      utilityScore: 88,
      realWorldAdoption: 65,
      dAppsTVL: 1850000000,
      interoperability: 70
    },
    governance: {
      type: 'dao',
      votingMechanism: 'On-chain governance via Solana Realms',
      proposalSuccessRate: 72,
      voterParticipation: 28.5,
      governanceScore: 74,
      controlConcentration: 45
    },
    liquidityDepth: {
      usdLiquidity: 750000000,
      slippageImpact: 0.9,
      liquidityScore: 82
    },
    economicAlignmentScore: 75,
    sustainabilityScore: 77,
    overallHealthScore: 79,
    riskFactors: [
      'Centralization concerns',
      'Network instability history',
      'VC token concentration',
      'Remaining token unlocks'
    ],
    bullishFactors: [
      'High transaction throughput',
      'Growing developer ecosystem',
      'Strong institutional backing',
      'Consumer application focus',
      'Low transaction costs'
    ]
  }
};

/**
 * Get tokenomics health data for a specific token
 */
export function getTokenHealth(token: string): TokenHealth | null {
  const normalizedToken = token.toUpperCase();
  return tokenHealthData[normalizedToken] || null;
}

/**
 * Analyze upcoming token unlock events and their potential market impact
 */
export function analyzeUpcomingUnlocks(token: string, lookAheadDays: number = 90): {
  hasSignificantUnlocks: boolean;
  nextUnlockDate?: number;
  nextUnlockAmount?: number;
  nextUnlockPercentage?: number;
  marketImpactPrediction: 'negligible' | 'low' | 'medium' | 'high' | 'severe';
  recommendation: string;
} {
  const health = getTokenHealth(token);
  if (!health) {
    return {
      hasSignificantUnlocks: false,
      marketImpactPrediction: 'negligible',
      recommendation: 'No tokenomics data available for analysis.'
    };
  }
  
  const { distribution } = health;
  const nextUnlockDate = distribution.vestingSchedule.nextUnlockDate;
  const nextUnlockAmount = distribution.vestingSchedule.nextUnlockAmount;
  
  // If no unlock date or amount is specified, or unlock is beyond lookAheadDays
  if (!nextUnlockDate || !nextUnlockAmount || 
      nextUnlockDate > Date.now() + lookAheadDays * 24 * 60 * 60 * 1000) {
    return {
      hasSignificantUnlocks: false,
      marketImpactPrediction: 'negligible',
      recommendation: 'No significant token unlocks expected in the specified timeframe.'
    };
  }
  
  // Calculate percentage of circulating supply
  const unlockPercentage = (nextUnlockAmount / distribution.circulatingSupply) * 100;
  
  // Determine market impact based on unlock percentage
  let marketImpact: 'negligible' | 'low' | 'medium' | 'high' | 'severe';
  let recommendation: string;
  
  if (unlockPercentage < 1) {
    marketImpact = 'negligible';
    recommendation = 'Unlock is negligible relative to circulating supply. No action required.';
  } else if (unlockPercentage < 3) {
    marketImpact = 'low';
    recommendation = 'Minor unlock event. Monitor for potential short-term volatility.';
  } else if (unlockPercentage < 7) {
    marketImpact = 'medium';
    recommendation = 'Moderate unlock event. Consider reducing position size before unlock date.';
  } else if (unlockPercentage < 15) {
    marketImpact = 'high';
    recommendation = 'Significant unlock event. Consider hedging positions or implementing tight stop losses.';
  } else {
    marketImpact = 'severe';
    recommendation = 'Major unlock event with potential for severe downward pressure. Consider temporarily exiting positions or implementing strong hedges.';
  }
  
  return {
    hasSignificantUnlocks: true,
    nextUnlockDate,
    nextUnlockAmount,
    nextUnlockPercentage: unlockPercentage,
    marketImpactPrediction: marketImpact,
    recommendation
  };
}

/**
 * Evaluate the long-term sustainability of a token's economic model
 */
export function evaluateTokenSustainability(token: string): {
  sustainabilityScore: number; // 0-100
  keyStrengths: string[];
  keyWeaknesses: string[];
  longTermOutlook: 'bearish' | 'neutral' | 'bullish';
  inflationForecast: number; // annual % in 1 year
  supplyDilutionRisk: 'low' | 'medium' | 'high';
} {
  const health = getTokenHealth(token);
  if (!health) {
    return {
      sustainabilityScore: 0,
      keyStrengths: [],
      keyWeaknesses: ['Insufficient data for analysis'],
      longTermOutlook: 'neutral',
      inflationForecast: 0,
      supplyDilutionRisk: 'medium'
    };
  }
  
  // Extract strengths and weaknesses
  const keyStrengths = health.bullishFactors.slice(0, 3); // Top 3 strengths
  const keyWeaknesses = health.riskFactors.slice(0, 3); // Top 3 weaknesses
  
  // Determine long-term outlook based on overall health score
  let longTermOutlook: 'bearish' | 'neutral' | 'bullish';
  if (health.overallHealthScore >= 80) {
    longTermOutlook = 'bullish';
  } else if (health.overallHealthScore >= 60) {
    longTermOutlook = 'neutral';
  } else {
    longTermOutlook = 'bearish';
  }
  
  // Project inflation rate one year in the future
  let inflationForecast = health.inflation.annualInflation;
  
  // Adjust for emission reduction events in the next year
  const oneYearFromNow = Date.now() + 365 * 24 * 60 * 60 * 1000;
  for (const event of health.inflation.emissionSchedule.emissionReductionEvents) {
    if (event.date > Date.now() && event.date < oneYearFromNow) {
      inflationForecast *= (1 - event.reductionPercentage / 100);
    }
  }
  
  // Adjust for burning mechanism if present
  if (health.inflation.burningMechanism) {
    // Estimate burn rate based on utility metrics
    const estimatedBurnRate = health.utility.feesGenerated / (health.distribution.circulatingSupply * getTokenPrice(token)) * 100;
    inflationForecast -= estimatedBurnRate;
  }
  
  // Determine supply dilution risk
  let supplyDilutionRisk: 'low' | 'medium' | 'high';
  if (inflationForecast < 2 || health.distribution.maxSupply !== null) {
    supplyDilutionRisk = 'low';
  } else if (inflationForecast < 8) {
    supplyDilutionRisk = 'medium';
  } else {
    supplyDilutionRisk = 'high';
  }
  
  return {
    sustainabilityScore: health.sustainabilityScore,
    keyStrengths,
    keyWeaknesses,
    longTermOutlook,
    inflationForecast,
    supplyDilutionRisk
  };
}

/**
 * Analyze a token's economic structure and distribution for fair alignment of incentives
 */
export function analyzeEconomicAlignment(token: string): {
  alignmentScore: number; // 0-100
  insiderConcentration: number; // percentage
  founderTokenLockup: 'none' | 'weak' | 'moderate' | 'strong';
  communityOwnership: number; // percentage
  misalignmentRisks: string[];
  stakingIncentives: 'poor' | 'moderate' | 'strong';
  summary: string;
} {
  const health = getTokenHealth(token);
  if (!health) {
    return {
      alignmentScore: 0,
      insiderConcentration: 0,
      founderTokenLockup: 'none',
      communityOwnership: 0,
      misalignmentRisks: ['Insufficient data for analysis'],
      stakingIncentives: 'poor',
      summary: 'No tokenomics data available for this asset.'
    };
  }
  
  // Calculate insider concentration (team + early investors)
  const insiderConcentration = health.distribution.teamAllocation;
  
  // Determine founder token lockup strength
  let founderTokenLockup: 'none' | 'weak' | 'moderate' | 'strong';
  if (!health.distribution.vestingSchedule.teamVesting) {
    founderTokenLockup = 'none';
  } else if (health.distribution.vestingSchedule.vestingPeriod < 12) {
    founderTokenLockup = 'weak';
  } else if (health.distribution.vestingSchedule.vestingPeriod < 36) {
    founderTokenLockup = 'moderate';
  } else {
    founderTokenLockup = 'strong';
  }
  
  // Estimate community ownership (rough approximation)
  const communityOwnership = 100 - insiderConcentration - health.distribution.topHolders.top10Percentage;
  
  // Identify misalignment risks
  const misalignmentRisks: string[] = [];
  
  if (insiderConcentration > 30) {
    misalignmentRisks.push('High insider token concentration');
  }
  
  if (health.distribution.topHolders.top10Percentage > 50) {
    misalignmentRisks.push('Centralized token distribution');
  }
  
  if (health.governance.controlConcentration > 60) {
    misalignmentRisks.push('Centralized governance control');
  }
  
  if (health.governance.type === 'centralized') {
    misalignmentRisks.push('Centralized decision-making');
  }
  
  if (health.inflation.annualInflation > 20) {
    misalignmentRisks.push('Excessive inflation rate');
  }
  
  // Determine staking incentives
  let stakingIncentives: 'poor' | 'moderate' | 'strong';
  if (health.inflation.stakingRatio > 40) {
    stakingIncentives = 'strong';
  } else if (health.inflation.stakingRatio > 15) {
    stakingIncentives = 'moderate';
  } else {
    stakingIncentives = 'poor';
  }
  
  // Generate summary
  let summary = '';
  if (health.economicAlignmentScore >= 80) {
    summary = `${token} has a well-designed tokenomic structure with strong alignment between token holders and project success. The combination of ${founderTokenLockup} founder lockups and ${stakingIncentives} staking incentives creates a solid foundation for long-term growth.`;
  } else if (health.economicAlignmentScore >= 60) {
    summary = `${token} has a reasonable tokenomic design with moderate alignment issues. The ${misalignmentRisks.length > 0 ? misalignmentRisks[0].toLowerCase() : 'token distribution'} could be improved, but overall the economic structure is sustainable.`;
  } else {
    summary = `${token} shows significant tokenomic misalignment issues, particularly related to ${misalignmentRisks.slice(0, 2).join(' and ')}. These factors may create challenges for long-term value accrual to token holders.`;
  }
  
  return {
    alignmentScore: health.economicAlignmentScore,
    insiderConcentration,
    founderTokenLockup,
    communityOwnership,
    misalignmentRisks,
    stakingIncentives,
    summary
  };
}

/**
 * Get tokenomics health signal for trading decisions
 */
export async function getTokenomicsHealthSignal(token: string): Promise<{
  signal: number; // -100 to 100
  confidence: number; // 0-100
  unlockWarning: boolean;
  sustainabilityRating: number; // 0-100
  economicAlignmentRating: number; // 0-100
  longTermOutlook: 'bearish' | 'neutral' | 'bullish';
  shortTermRisks: string[];
  recommendations: string[];
}> {
  try {
    // Get token health data
    const health = getTokenHealth(token);
    if (!health) {
      return {
        signal: 0,
        confidence: 30,
        unlockWarning: false,
        sustainabilityRating: 50,
        economicAlignmentRating: 50,
        longTermOutlook: 'neutral',
        shortTermRisks: ['Insufficient tokenomics data available'],
        recommendations: ['Conduct further research before trading']
      };
    }
    
    // Analyze upcoming unlocks
    const unlockAnalysis = analyzeUpcomingUnlocks(token);
    
    // Evaluate sustainability
    const sustainabilityAnalysis = evaluateTokenSustainability(token);
    
    // Analyze economic alignment
    const alignmentAnalysis = analyzeEconomicAlignment(token);
    
    // Calculate signal based on various factors
    let signal = 0;
    
    // Factor 1: Tokenomics health (40% weight)
    signal += (health.overallHealthScore - 50) * 0.8; // Convert 0-100 to -40 to +40
    
    // Factor 2: Unlock impact (30% weight)
    if (unlockAnalysis.hasSignificantUnlocks) {
      const unlockImpactMap: Record<string, number> = {
        'negligible': 0,
        'low': -5,
        'medium': -15,
        'high': -25,
        'severe': -30
      };
      signal += unlockImpactMap[unlockAnalysis.marketImpactPrediction] || 0;
    }
    
    // Factor 3: Long-term outlook (30% weight)
    const outlookMap: Record<string, number> = {
      'bearish': -30,
      'neutral': 0,
      'bullish': 30
    };
    signal += outlookMap[sustainabilityAnalysis.longTermOutlook] || 0;
    
    // Generate recommendations based on analysis
    const recommendations: string[] = [];
    
    if (unlockAnalysis.hasSignificantUnlocks) {
      recommendations.push(unlockAnalysis.recommendation);
    }
    
    if (sustainabilityAnalysis.supplyDilutionRisk === 'high') {
      recommendations.push('Consider the impact of high inflation on long-term holdings.');
    }
    
    if (alignmentAnalysis.misalignmentRisks.length > 0) {
      recommendations.push(`Be aware of tokenomic misalignment: ${alignmentAnalysis.misalignmentRisks[0]}`);
    }
    
    // Compile short-term risks
    const shortTermRisks: string[] = [];
    
    if (unlockAnalysis.hasSignificantUnlocks) {
      shortTermRisks.push(`Token unlock of ${unlockAnalysis.nextUnlockPercentage?.toFixed(1)}% of supply on ${new Date(unlockAnalysis.nextUnlockDate || 0).toLocaleDateString()}`);
    }
    
    if (health.distribution.exchangeHoldings > 20) {
      shortTermRisks.push('High exchange concentration increases sell pressure risk');
    }
    
    if (sustainabilityAnalysis.inflationForecast > 10) {
      shortTermRisks.push(`High inflation rate (${sustainabilityAnalysis.inflationForecast.toFixed(1)}% projected)`);
    }
    
    // If there are insufficient short-term risks identified, add from token's risk factors
    if (shortTermRisks.length === 0 && health.riskFactors.length > 0) {
      shortTermRisks.push(health.riskFactors[0]);
    }
    
    // Determine confidence based on data quality
    const confidence = health.distribution && health.inflation && health.utility ? 80 : 50;
    
    return {
      signal: Math.max(-100, Math.min(100, signal)), // Clamp between -100 and 100
      confidence,
      unlockWarning: unlockAnalysis.hasSignificantUnlocks,
      sustainabilityRating: sustainabilityAnalysis.sustainabilityScore,
      economicAlignmentRating: alignmentAnalysis.alignmentScore,
      longTermOutlook: sustainabilityAnalysis.longTermOutlook,
      shortTermRisks,
      recommendations
    };
  } catch (error) {
    console.error('Error in tokenomics health signal generation:', error);
    return {
      signal: 0,
      confidence: 0,
      unlockWarning: false,
      sustainabilityRating: 0,
      economicAlignmentRating: 0,
      longTermOutlook: 'neutral',
      shortTermRisks: ['Error analyzing tokenomics data'],
      recommendations: ['Unable to generate recommendations due to error']
    };
  }
}

// Helper function to get token price (simplified for demo)
function getTokenPrice(token: string): number {
  const prices: Record<string, number> = {
    'BTC': 61200,
    'ETH': 3510,
    'SOL': 150,
    // Add more tokens as needed
  };
  
  return prices[token.toUpperCase()] || 1;
}
