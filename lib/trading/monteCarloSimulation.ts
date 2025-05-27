/**
 * Monte Carlo Simulation for Trading Strategy Evaluation
 * Simulates future performance based on historical trade data
 */

export interface TradeResult {
  id: string;
  timestamp: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
  duration: number; // in minutes
  strategy: string;
}

export interface MonteCarloResult {
  simulationCount: number;
  startingBalance: number;
  finalBalances: number[];
  medianBalance: number;
  mean: number;
  stdDev: number;
  percentiles: {
    worst: number;
    best: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  maxDrawdowns: {
    median: number;
    worst: number;
    best: number;
  };
  winRates: {
    median: number;
    worst: number;
    best: number;
  };
  profitFactor: {
    median: number;
    worst: number;
    best: number;
  };
  returnOnAccount: {
    median: number;
    worst: number;
    best: number;
  };
  equityCurve: number[][];
}

/**
 * Run Monte Carlo simulation on trade results
 * @param trades Array of trade results to analyze
 * @param initialBalance Starting account balance
 * @param simulationCount Number of simulations to run
 * @returns Monte Carlo simulation results
 */
export function runMonteCarloSimulation(
  trades: TradeResult[],
  initialBalance: number,
  simulationCount: number = 1000
): MonteCarloResult {
  // Validate inputs
  if (trades.length < 5) {
    throw new Error('At least 5 trades are required for Monte Carlo simulation');
  }
  
  if (initialBalance <= 0) {
    throw new Error('Initial balance must be positive');
  }
  
  // Initialize results
  const finalBalances: number[] = [];
  const maxDrawdowns: number[] = [];
  const winRates: number[] = [];
  const profitFactors: number[] = [];
  const returnRates: number[] = [];
  let equityCurve: number[][] = [];
  
  // Extract PnL percentages for resampling
  const pnlPercentages = trades.map(trade => trade.pnlPercent);
  
  // Run simulations
  for (let sim = 0; sim < simulationCount; sim++) {
    const { 
      finalBalance, 
      maxDrawdown, 
      equityCurveData,
      winRate,
      profitFactor,
      returnOnAccount
    } = simulateTradingSequence(pnlPercentages, initialBalance);
    
    finalBalances.push(finalBalance);
    maxDrawdowns.push(maxDrawdown);
    winRates.push(winRate);
    profitFactors.push(profitFactor);
    returnRates.push(returnOnAccount);
    
    // Only store one equity curve (from median simulation) to reduce memory usage
    if (sim === Math.floor(simulationCount / 2)) {
      equityCurve = equityCurveData;
    }
  }
  
  // Sort results for percentiles
  finalBalances.sort((a, b) => a - b);
  maxDrawdowns.sort((a, b) => a - b);
  winRates.sort((a, b) => a - b);
  profitFactors.sort((a, b) => a - b);
  returnRates.sort((a, b) => a - b);
  
  // Calculate statistics
  const mean = calculateMean(finalBalances);
  const stdDev = calculateStdDev(finalBalances, mean);
  
  // Calculate percentiles
  const getPercentile = (arr: number[], percentile: number) => {
    const index = Math.floor(arr.length * percentile / 100);
    return arr[index];
  };
  
  const medianIndex = Math.floor(finalBalances.length / 2);
  const medianBalance = finalBalances[medianIndex];
  
  return {
    simulationCount,
    startingBalance: initialBalance,
    finalBalances,
    medianBalance,
    mean,
    stdDev,
    percentiles: {
      worst: finalBalances[0],
      best: finalBalances[finalBalances.length - 1],
      p10: getPercentile(finalBalances, 10),
      p25: getPercentile(finalBalances, 25),
      p50: getPercentile(finalBalances, 50),
      p75: getPercentile(finalBalances, 75),
      p90: getPercentile(finalBalances, 90),
    },
    maxDrawdowns: {
      median: getPercentile(maxDrawdowns, 50),
      worst: maxDrawdowns[maxDrawdowns.length - 1],
      best: maxDrawdowns[0],
    },
    winRates: {
      median: getPercentile(winRates, 50),
      worst: winRates[0],
      best: winRates[winRates.length - 1],
    },
    profitFactor: {
      median: getPercentile(profitFactors, 50),
      worst: profitFactors[0],
      best: profitFactors[profitFactors.length - 1],
    },
    returnOnAccount: {
      median: getPercentile(returnRates, 50),
      worst: returnRates[0],
      best: returnRates[returnRates.length - 1],
    },
    equityCurve,
  };
}

/**
 * Simulate a trading sequence using bootstrap resampling
 * @param pnlPercentages Array of PnL percentages from historical trades
 * @param initialBalance Starting account balance
 * @returns Simulation results
 */
function simulateTradingSequence(
  pnlPercentages: number[],
  initialBalance: number
): {
  finalBalance: number;
  maxDrawdown: number;
  equityCurveData: number[][];
  winRate: number;
  profitFactor: number;
  returnOnAccount: number;
} {
  const numTrades = pnlPercentages.length;
  let balance = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let wins = 0;
  let totalProfit = 0;
  let totalLoss = 0;
  
  // Create equity curve data [trade index, balance]
  const equityCurveData: number[][] = [[0, initialBalance]];
  
  // Generate random sequence by sampling with replacement
  for (let i = 0; i < numTrades; i++) {
    // Select random trade from history
    const randomIndex = Math.floor(Math.random() * numTrades);
    const pnlPercent = pnlPercentages[randomIndex];
    
    // Apply PnL to balance
    const tradeResult = balance * (pnlPercent / 100);
    balance += tradeResult;
    
    // Ensure balance doesn't go negative
    balance = Math.max(balance, 0.01);
    
    // Update equity curve
    equityCurveData.push([i + 1, balance]);
    
    // Track drawdown
    if (balance > peak) {
      peak = balance;
    } else {
      const drawdown = (peak - balance) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Track win/loss statistics
    if (tradeResult > 0) {
      wins++;
      totalProfit += tradeResult;
    } else {
      totalLoss += Math.abs(tradeResult);
    }
  }
  
  // Calculate metrics
  const winRate = (wins / numTrades) * 100;
  const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  const returnOnAccount = ((balance - initialBalance) / initialBalance) * 100;
  
  return {
    finalBalance: balance,
    maxDrawdown,
    equityCurveData,
    winRate,
    profitFactor,
    returnOnAccount,
  };
}

/**
 * Calculate arithmetic mean of an array
 * @param arr Array of numbers
 * @returns Mean value
 */
function calculateMean(arr: number[]): number {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

/**
 * Calculate standard deviation of an array
 * @param arr Array of numbers
 * @param mean Mean value (optional, calculated if not provided)
 * @returns Standard deviation
 */
function calculateStdDev(arr: number[], mean?: number): number {
  const m = mean !== undefined ? mean : calculateMean(arr);
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Calculate confidence interval for Monte Carlo results
 * @param mean Mean of the distribution
 * @param stdDev Standard deviation
 * @param confidenceLevel Confidence level (e.g., 95 for 95% confidence)
 * @returns Confidence interval [lower, upper]
 */
export function calculateConfidenceInterval(
  mean: number,
  stdDev: number,
  confidenceLevel: number = 95
): [number, number] {
  // Z-score for common confidence levels
  const zScores: Record<number, number> = {
    90: 1.645,
    95: 1.96,
    99: 2.576,
  };
  
  const z = zScores[confidenceLevel] || 1.96; // Default to 95% if level not found
  const marginOfError = z * stdDev;
  
  return [mean - marginOfError, mean + marginOfError];
}

/**
 * Calculate Kelly Criterion for optimal position sizing
 * @param winRate Win rate as decimal (0-1)
 * @param winLossRatio Ratio of average win to average loss
 * @returns Kelly percentage (0-1)
 */
export function calculateKellyCriterion(winRate: number, winLossRatio: number): number {
  // Convert percentage to decimal if needed
  const wr = winRate > 1 ? winRate / 100 : winRate;
  
  // Kelly formula: f* = (p*b - q) / b
  // where p = win probability, q = loss probability (1-p), b = win/loss ratio
  const kellyPercentage = (wr * winLossRatio - (1 - wr)) / winLossRatio;
  
  // Cap at 1 (100%) and floor at 0 (0%)
  return Math.max(0, Math.min(1, kellyPercentage));
}

/**
 * Calculate optimal risk per trade based on Monte Carlo results
 * @param monteCarloResult Monte Carlo simulation results
 * @param riskTolerance Risk tolerance level (conservative, moderate, aggressive)
 * @returns Recommended risk percentage
 */
export function calculateOptimalRiskPerTrade(
  monteCarloResult: MonteCarloResult,
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
): number {
  // Extract key metrics
  const { maxDrawdowns, winRates, profitFactor } = monteCarloResult;
  
  // Base risk on the median maximum drawdown
  let baseRisk = 0;
  
  switch (riskTolerance) {
    case 'conservative':
      // Use worst-case drawdown scenario
      baseRisk = 0.5 / maxDrawdowns.worst * 100;
      break;
    case 'moderate':
      // Use median drawdown
      baseRisk = 0.75 / maxDrawdowns.median * 100;
      break;
    case 'aggressive':
      // Use better-than-median drawdown
      baseRisk = 1 / (maxDrawdowns.median * 0.8) * 100;
      break;
  }
  
  // Adjust based on win rate and profit factor
  let adjustment = 1.0;
  
  // Win rate adjustment
  if (winRates.median > 60) adjustment += 0.2;
  if (winRates.median < 40) adjustment -= 0.2;
  
  // Profit factor adjustment
  if (profitFactor.median > 2.0) adjustment += 0.2;
  if (profitFactor.median < 1.2) adjustment -= 0.2;
  
  // Apply adjustment
  baseRisk *= adjustment;
  
  // Cap risk percentage (conservative: 1%, moderate: 2%, aggressive: 3%)
  const riskCaps = {
    'conservative': 1.0,
    'moderate': 2.0,
    'aggressive': 3.0
  };
  
  return Math.min(baseRisk, riskCaps[riskTolerance]);
}
