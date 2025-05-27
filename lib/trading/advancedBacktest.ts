'use client';

import { IndicatorSignal } from './indicators';
import { TradeRecord } from './autoTrader';

interface BacktestParams {
  symbol: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  strategies: string[];
  timeframes: string[];
  riskPerTrade: number;
  useMacroData?: boolean;
  useOnChainData?: boolean;
  takeProfitPercent?: number;
  stopLossPercent?: number;
  monteCarloSimulations?: number;
}

interface BacktestResult {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalProfit: number;
  totalProfitPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  trades: TradeRecord[];
  bestStrategy: {
    name: string;
    winRate: number;
    profitFactor: number;
    trades: number;
  };
  bestTimeframe: {
    timeframe: string;
    winRate: number;
    profitFactor: number;
    trades: number;
  };
  monteCarloResults?: {
    confidenceIntervals: {
      percent: number;
      minReturn: number;
      maxReturn: number;
    }[];
    expectedReturn: number;
    expectedDrawdown: number;
    failureRate: number;
    worstCaseDrawdown: number;
    simulationCount: number;
  };
  equityCurve: {
    date: number;
    equity: number;
    drawdown: number;
    drawdownPercent: number;
  }[];
}

// Main backtest function with Monte Carlo simulations
export async function runAdvancedBacktest(params: BacktestParams): Promise<BacktestResult> {
  console.log('Running advanced backtest with params:', params);
  
  // Simulate loading historical data
  const historicalData = await fetchHistoricalData(params.symbol, params.startDate, params.endDate);
  
  // Simulate analyzing the data and running strategies
  const trades = generateBacktestTrades(historicalData, params);
  
  // Calculate backtest metrics
  const metrics = calculateMetrics(trades, params.initialCapital);
  
  // Generate equity curve
  const equityCurve = generateEquityCurve(trades, params.initialCapital);
  
  // Run Monte Carlo simulations if enabled
  let monteCarloResults;
  if (params.monteCarloSimulations && params.monteCarloSimulations > 0) {
    monteCarloResults = runMonteCarloSimulation(
      trades,
      params.initialCapital,
      params.monteCarloSimulations
    );
  }
  
  // Find best strategy and timeframe
  const bestStrategy = findBestStrategy(trades);
  const bestTimeframe = findBestTimeframe(trades);
  
  // Return comprehensive results
  return {
    symbol: params.symbol,
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    initialCapital: params.initialCapital,
    finalCapital: metrics.finalCapital,
    totalProfit: metrics.totalProfit,
    totalProfitPercent: metrics.totalProfitPercent,
    winRate: metrics.winRate,
    totalTrades: metrics.totalTrades,
    winningTrades: metrics.winningTrades,
    losingTrades: metrics.losingTrades,
    averageProfit: metrics.averageProfit,
    averageLoss: metrics.averageLoss,
    profitFactor: metrics.profitFactor,
    maxDrawdown: metrics.maxDrawdown,
    maxDrawdownPercent: metrics.maxDrawdownPercent,
    sharpeRatio: metrics.sharpeRatio,
    sortinoRatio: metrics.sortinoRatio,
    calmarRatio: metrics.calmarRatio,
    trades,
    bestStrategy,
    bestTimeframe,
    monteCarloResults,
    equityCurve
  };
}

// Function to fetch historical data
async function fetchHistoricalData(symbol: string, startDate: Date, endDate: Date) {
  // In a real implementation, this would fetch actual historical data
  console.log(`Fetching historical data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  // Create a realistic candle data array with proper timestamp spacing
  const candles = [];
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  
  let currentTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  // Starting price around a realistic value
  let lastClose = symbol.includes('BTC') ? 25000 + (Math.random() * 10000 - 5000) :
                  symbol.includes('ETH') ? 1800 + (Math.random() * 400 - 200) :
                  symbol.includes('SOL') ? 50 + (Math.random() * 20 - 10) : 100;
  
  // Generate realistic price movements
  while (currentTime < endTime) {
    // Typical volatility parameters
    const dailyVolatility = symbol.includes('BTC') ? 0.03 : 
                           symbol.includes('ETH') ? 0.04 :
                           symbol.includes('SOL') ? 0.06 : 0.05;
    
    // Random walk with some mean reversion and occasional trends
    const trend = Math.sin(currentTime / (14 * dayMs)) * 0.2; // Cyclical trend component
    const randomComponent = (Math.random() - 0.5) * dailyVolatility;
    const priceChange = lastClose * (randomComponent + trend * 0.01);
    
    // Calculate OHLC data
    const open = lastClose;
    const close = open + priceChange;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01); // Random high above max(open,close)
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);  // Random low below min(open,close)
    const volume = Math.floor(100000 + Math.random() * 900000);       // Random volume
    
    candles.push({
      timestamp: currentTime,
      open,
      high,
      low,
      close,
      volume
    });
    
    lastClose = close;
    currentTime += hourMs; // Add one hour for each candle
  }
  
  return candles;
}

// Function to generate backtest trades
function generateBacktestTrades(historicalData: any[], params: BacktestParams): TradeRecord[] {
  const trades: TradeRecord[] = [];
  let inPosition = false;
  let entryPrice = 0;
  let entryTime = 0;
  let strategy = '';
  let timeframe = '';
  let currentCapital = params.initialCapital;
  
  // Simulate running strategies on historical data
  for (let i = 60; i < historicalData.length; i++) { // Start at 60 to have enough data for indicators
    const currentCandle = historicalData[i];
    const currentTime = currentCandle.timestamp;
    
    // Skip weekends if we want to simulate forex/stocks (not needed for crypto)
    const date = new Date(currentTime);
    // const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    // if (isWeekend) continue;
    
    // If in position, check for exit conditions
    if (inPosition) {
      // Check stop loss
      if (params.stopLossPercent) {
        const stopPrice = strategy.includes('short') 
          ? entryPrice * (1 + params.stopLossPercent / 100)
          : entryPrice * (1 - params.stopLossPercent / 100);
        
        if ((strategy.includes('short') && currentCandle.high >= stopPrice) ||
            (!strategy.includes('short') && currentCandle.low <= stopPrice)) {
          // Stop loss hit
          const exitPrice = stopPrice;
          const profitLoss = strategy.includes('short')
            ? (entryPrice - exitPrice) / entryPrice * 100
            : (exitPrice - entryPrice) / entryPrice * 100;
          
          trades.push({
            symbol: params.symbol,
            timeframe,
            side: strategy.includes('short') ? 'Sell' : 'Buy',
            entryPrice,
            exitPrice,
            size: (params.riskPerTrade / 100 * currentCapital / entryPrice).toFixed(4),
            entryTime,
            exitTime: currentTime,
            profitLoss: profitLoss * params.riskPerTrade / 100 * currentCapital,
            profitLossPercent: profitLoss,
            strategy,
            signalStrength: Math.random() * 20 + 60, // Random signal strength 60-80
            orderId: `backtest-${trades.length + 1}`,
            status: 'closed'
          });
          
          // Update capital
          currentCapital += profitLoss * params.riskPerTrade / 100 * currentCapital;
          inPosition = false;
          continue;
        }
      }
      
      // Check take profit
      if (params.takeProfitPercent) {
        const tpPrice = strategy.includes('short')
          ? entryPrice * (1 - params.takeProfitPercent / 100)
          : entryPrice * (1 + params.takeProfitPercent / 100);
        
        if ((strategy.includes('short') && currentCandle.low <= tpPrice) ||
            (!strategy.includes('short') && currentCandle.high >= tpPrice)) {
          // Take profit hit
          const exitPrice = tpPrice;
          const profitLoss = strategy.includes('short')
            ? (entryPrice - exitPrice) / entryPrice * 100
            : (exitPrice - entryPrice) / entryPrice * 100;
          
          trades.push({
            symbol: params.symbol,
            timeframe,
            side: strategy.includes('short') ? 'Sell' : 'Buy',
            entryPrice,
            exitPrice,
            size: (params.riskPerTrade / 100 * currentCapital / entryPrice).toFixed(4),
            entryTime,
            exitTime: currentTime,
            profitLoss: profitLoss * params.riskPerTrade / 100 * currentCapital,
            profitLossPercent: profitLoss,
            strategy,
            signalStrength: Math.random() * 20 + 60, // Random signal strength 60-80
            orderId: `backtest-${trades.length + 1}`,
            status: 'closed'
          });
          
          // Update capital
          currentCapital += profitLoss * params.riskPerTrade / 100 * currentCapital;
          inPosition = false;
          continue;
        }
      }
      
      // Check for opposing signal or 15-candle exit
      if (i - entryTime / (60 * 60 * 1000) > 15 || Math.random() < 0.15) { // 15% chance of exit on each candle
        const exitPrice = currentCandle.close;
        const profitLoss = strategy.includes('short')
          ? (entryPrice - exitPrice) / entryPrice * 100
          : (exitPrice - entryPrice) / entryPrice * 100;
        
        trades.push({
          symbol: params.symbol,
          timeframe,
          side: strategy.includes('short') ? 'Sell' : 'Buy',
          entryPrice,
          exitPrice,
          size: (params.riskPerTrade / 100 * currentCapital / entryPrice).toFixed(4),
          entryTime,
          exitTime: currentTime,
          profitLoss: profitLoss * params.riskPerTrade / 100 * currentCapital,
          profitLossPercent: profitLoss,
          strategy,
          signalStrength: Math.random() * 20 + 60, // Random signal strength 60-80
          orderId: `backtest-${trades.length + 1}`,
          status: 'closed'
        });
        
        // Update capital
        currentCapital += profitLoss * params.riskPerTrade / 100 * currentCapital;
        inPosition = false;
      }
    } else {
      // Check for entry conditions if not in position
      // Randomly generate signals based on strategies and market conditions
      
      // 10% chance of entry on each candle, but vary based on market conditions
      let entryProbability = 0.1;
      
      // Adjust probability based on volatility
      const recent = historicalData.slice(i - 20, i);
      const returns = recent.map((c, idx) => idx > 0 ? (c.close - recent[idx-1].close) / recent[idx-1].close : 0).slice(1);
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length) * 100;
      
      if (volatility > 3) { // High volatility periods
        entryProbability *= 1.5;
      } else if (volatility < 1) { // Low volatility periods
        entryProbability *= 0.5;
      }
      
      if (Math.random() < entryProbability) {
        // Determine trade direction based on recent price action
        const isUptrend = recent[recent.length-1].close > recent[0].close;
        
        // Randomly select strategy and timeframe from params
        strategy = params.strategies[Math.floor(Math.random() * params.strategies.length)];
        timeframe = params.timeframes[Math.floor(Math.random() * params.timeframes.length)];
        
        // Add "long" or "short" to strategy name based on direction
        strategy = isUptrend ? `${strategy} (long)` : `${strategy} (short)`;
        
        // Enter position
        inPosition = true;
        entryPrice = currentCandle.close;
        entryTime = currentTime;
      }
    }
  }
  
  // Close any open position at the end of backtest
  if (inPosition) {
    const lastCandle = historicalData[historicalData.length - 1];
    const exitPrice = lastCandle.close;
    const profitLoss = strategy.includes('short')
      ? (entryPrice - exitPrice) / entryPrice * 100
      : (exitPrice - entryPrice) / entryPrice * 100;
    
    trades.push({
      symbol: params.symbol,
      timeframe,
      side: strategy.includes('short') ? 'Sell' : 'Buy',
      entryPrice,
      exitPrice,
      size: (params.riskPerTrade / 100 * currentCapital / entryPrice).toFixed(4),
      entryTime,
      exitTime: lastCandle.timestamp,
      profitLoss: profitLoss * params.riskPerTrade / 100 * currentCapital,
      profitLossPercent: profitLoss,
      strategy,
      signalStrength: Math.random() * 20 + 60, // Random signal strength 60-80
      orderId: `backtest-${trades.length + 1}`,
      status: 'closed'
    });
  }
  
  return trades;
}

// Function to calculate performance metrics
function calculateMetrics(trades: TradeRecord[], initialCapital: number) {
  if (trades.length === 0) {
    return {
      finalCapital: initialCapital,
      totalProfit: 0,
      totalProfitPercent: 0,
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      averageProfit: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      calmarRatio: 0
    };
  }
  
  // Calculate basic metrics
  const winningTrades = trades.filter(t => t.profitLoss! > 0).length;
  const losingTrades = trades.filter(t => t.profitLoss! <= 0).length;
  const totalTrades = trades.length;
  const winRate = (winningTrades / totalTrades) * 100;
  
  const grossProfit = trades
    .filter(t => t.profitLoss! > 0)
    .reduce((sum, t) => sum + t.profitLoss!, 0);
    
  const grossLoss = Math.abs(
    trades
      .filter(t => t.profitLoss! <= 0)
      .reduce((sum, t) => sum + t.profitLoss!, 0)
  );
  
  const totalProfit = grossProfit - grossLoss;
  const totalProfitPercent = (totalProfit / initialCapital) * 100;
  
  const averageProfit = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  
  // Calculate equity curve and drawdown
  let equity = initialCapital;
  let peak = initialCapital;
  let maxDrawdown = 0;
  
  // Sort trades by entry time
  const sortedTrades = [...trades].sort((a, b) => a.entryTime - b.entryTime);
  
  for (const trade of sortedTrades) {
    equity += trade.profitLoss!;
    if (equity > peak) {
      peak = equity;
    } else {
      const drawdown = peak - equity;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }
  
  const maxDrawdownPercent = (maxDrawdown / peak) * 100;
  const finalCapital = initialCapital + totalProfit;
  
  // Calculate risk-adjusted returns
  const returns = sortedTrades.map(t => t.profitLossPercent!);
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  
  const negativeReturns = returns.filter(r => r < 0);
  const downDev = negativeReturns.length > 0
    ? Math.sqrt(
        negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
      )
    : 0.0001; // Avoid division by zero
  
  const riskFreeRate = 2; // Assume 2% risk-free rate
  const excessReturn = totalProfitPercent - riskFreeRate;
  
  const sharpeRatio = stdDev > 0 ? excessReturn / stdDev : 0;
  const sortinoRatio = downDev > 0 ? excessReturn / downDev : 0;
  const calmarRatio = maxDrawdownPercent > 0 ? totalProfitPercent / maxDrawdownPercent : 0;
  
  return {
    finalCapital,
    totalProfit,
    totalProfitPercent,
    winRate,
    totalTrades,
    winningTrades,
    losingTrades,
    averageProfit,
    averageLoss,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent,
    sharpeRatio,
    sortinoRatio,
    calmarRatio
  };
}

// Function to generate equity curve
function generateEquityCurve(trades: TradeRecord[], initialCapital: number) {
  if (trades.length === 0) {
    return [];
  }
  
  // Sort trades by exit time
  const sortedTrades = [...trades].sort((a, b) => a.exitTime! - b.exitTime!);
  
  let equity = initialCapital;
  let peak = initialCapital;
  const equityCurve = [{
    date: sortedTrades[0].entryTime - 86400000, // One day before first trade
    equity: initialCapital,
    drawdown: 0,
    drawdownPercent: 0
  }];
  
  for (const trade of sortedTrades) {
    equity += trade.profitLoss!;
    
    if (equity > peak) {
      peak = equity;
    }
    
    const drawdown = peak - equity;
    const drawdownPercent = (drawdown / peak) * 100;
    
    equityCurve.push({
      date: trade.exitTime!,
      equity,
      drawdown,
      drawdownPercent
    });
  }
  
  return equityCurve;
}

// Function to run Monte Carlo simulation
function runMonteCarloSimulation(
  trades: TradeRecord[],
  initialCapital: number,
  numSimulations: number
) {
  console.log(`Running ${numSimulations} Monte Carlo simulations...`);
  
  // Extract trade results as percentage returns
  const tradeReturns = trades.map(t => t.profitLossPercent!);
  
  // Run simulations
  const simulationResults = [];
  
  for (let i = 0; i < numSimulations; i++) {
    // Shuffle returns to create a new sequence
    const shuffledReturns = [...tradeReturns].sort(() => Math.random() - 0.5);
    
    // Calculate equity curve
    let equity = initialCapital;
    let peak = initialCapital;
    let maxDrawdown = 0;
    const equityCurve = [initialCapital];
    
    for (const returnPct of shuffledReturns) {
      // Apply the return to the current equity
      const profit = equity * (returnPct / 100);
      equity += profit;
      equityCurve.push(equity);
      
      // Update peak and drawdown
      if (equity > peak) {
        peak = equity;
      } else {
        const drawdown = peak - equity;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    // Calculate final return and drawdown percentage
    const finalReturn = ((equity - initialCapital) / initialCapital) * 100;
    const maxDrawdownPercent = (maxDrawdown / peak) * 100;
    
    simulationResults.push({
      finalReturn,
      maxDrawdownPercent,
      finalEquity: equity
    });
  }
  
  // Calculate confidence intervals (95%, 90%, 75%)
  const sortedReturns = simulationResults
    .map(r => r.finalReturn)
    .sort((a, b) => a - b);
  
  const sortedDrawdowns = simulationResults
    .map(r => r.maxDrawdownPercent)
    .sort((a, b) => b - a); // Sort drawdowns in descending order
  
  const confidenceIntervals = [
    {
      percent: 95,
      minReturn: sortedReturns[Math.floor(numSimulations * 0.025)],
      maxReturn: sortedReturns[Math.floor(numSimulations * 0.975)]
    },
    {
      percent: 90,
      minReturn: sortedReturns[Math.floor(numSimulations * 0.05)],
      maxReturn: sortedReturns[Math.floor(numSimulations * 0.95)]
    },
    {
      percent: 75,
      minReturn: sortedReturns[Math.floor(numSimulations * 0.125)],
      maxReturn: sortedReturns[Math.floor(numSimulations * 0.875)]
    }
  ];
  
  // Calculate expected values
  const expectedReturn = sortedReturns.reduce((sum, r) => sum + r, 0) / numSimulations;
  const expectedDrawdown = sortedDrawdowns.reduce((sum, d) => sum + d, 0) / numSimulations;
  
  // Calculate failure rate (percentage of simulations with negative returns)
  const negativeReturns = sortedReturns.filter(r => r < 0).length;
  const failureRate = (negativeReturns / numSimulations) * 100;
  
  // Worst case drawdown (95th percentile)
  const worstCaseDrawdown = sortedDrawdowns[Math.floor(numSimulations * 0.05)];
  
  return {
    confidenceIntervals,
    expectedReturn,
    expectedDrawdown,
    failureRate,
    worstCaseDrawdown,
    simulationCount: numSimulations
  };
}

// Function to find best strategy
function findBestStrategy(trades: TradeRecord[]) {
  if (trades.length === 0) {
    return {
      name: 'None',
      winRate: 0,
      profitFactor: 0,
      trades: 0
    };
  }
  
  // Group trades by strategy
  const strategies: Record<string, TradeRecord[]> = {};
  
  for (const trade of trades) {
    const strategyName = trade.strategy;
    if (!strategies[strategyName]) {
      strategies[strategyName] = [];
    }
    strategies[strategyName].push(trade);
  }
  
  // Calculate metrics for each strategy
  const strategyMetrics = Object.entries(strategies).map(([name, strategyTrades]) => {
    const winningTrades = strategyTrades.filter(t => t.profitLoss! > 0).length;
    const totalTrades = strategyTrades.length;
    const winRate = (winningTrades / totalTrades) * 100;
    
    const grossProfit = strategyTrades
      .filter(t => t.profitLoss! > 0)
      .reduce((sum, t) => sum + t.profitLoss!, 0);
      
    const grossLoss = Math.abs(
      strategyTrades
        .filter(t => t.profitLoss! <= 0)
        .reduce((sum, t) => sum + t.profitLoss!, 0)
    );
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    return {
      name,
      winRate,
      profitFactor,
      trades: totalTrades
    };
  });
  
  // Sort by profit factor and then by win rate
  strategyMetrics.sort((a, b) => {
    if (b.profitFactor !== a.profitFactor) {
      return b.profitFactor - a.profitFactor;
    }
    return b.winRate - a.winRate;
  });
  
  // Return the best strategy
  return strategyMetrics[0] || {
    name: 'None',
    winRate: 0,
    profitFactor: 0,
    trades: 0
  };
}

// Function to find best timeframe
function findBestTimeframe(trades: TradeRecord[]) {
  if (trades.length === 0) {
    return {
      timeframe: 'None',
      winRate: 0,
      profitFactor: 0,
      trades: 0
    };
  }
  
  // Group trades by timeframe
  const timeframes: Record<string, TradeRecord[]> = {};
  
  for (const trade of trades) {
    const timeframe = trade.timeframe;
    if (!timeframes[timeframe]) {
      timeframes[timeframe] = [];
    }
    timeframes[timeframe].push(trade);
  }
  
  // Calculate metrics for each timeframe
  const timeframeMetrics = Object.entries(timeframes).map(([timeframe, timeframeTrades]) => {
    const winningTrades = timeframeTrades.filter(t => t.profitLoss! > 0).length;
    const totalTrades = timeframeTrades.length;
    const winRate = (winningTrades / totalTrades) * 100;
    
    const grossProfit = timeframeTrades
      .filter(t => t.profitLoss! > 0)
      .reduce((sum, t) => sum + t.profitLoss!, 0);
      
    const grossLoss = Math.abs(
      timeframeTrades
        .filter(t => t.profitLoss! <= 0)
        .reduce((sum, t) => sum + t.profitLoss!, 0)
    );
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    
    return {
      timeframe,
      winRate,
      profitFactor,
      trades: totalTrades
    };
  });
  
  // Sort by profit factor and then by win rate
  timeframeMetrics.sort((a, b) => {
    if (b.profitFactor !== a.profitFactor) {
      return b.profitFactor - a.profitFactor;
    }
    return b.winRate - a.winRate;
  });
  
  // Return the best timeframe
  return timeframeMetrics[0] || {
    timeframe: 'None',
    winRate: 0,
    profitFactor: 0,
    trades: 0
  };
}

// Export interface for component usage
export type { BacktestParams, BacktestResult };
