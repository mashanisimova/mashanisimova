'use client';

import { CandleData, IndicatorSignal, combineSignals, mean_reversion_signal, ema_crossover_signal, rsi_divergence_signal, bollinger_squeeze_signal, volume_spike_signal, adx_trend_signal, supertrend_signal, heikin_ashi_signal, fibonacci_retracement_signal, fractal_breakout_signal, cci_signal, stochastic_signal, williams_r_signal, parabolic_sar_signal, vwap_signal, breakout_signal, momentum_rsi_signal } from './indicators';

export type BacktestResult = {
  trades: Trade[];
  stats: BacktestStats;
  equityCurve: number[];
  drawdowns: number[];
  bestTrade: Trade;
  worstTrade: Trade;
};

export type BacktestStats = {
  startingBalance: number;
  endingBalance: number;
  totalProfit: number;
  profitPercent: number;
  numTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  riskRewardRatio: number;
};

export type Trade = {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: 'long' | 'short';
  size: number;
  profitLoss: number;
  profitLossPercent: number;
  strategy: string;
  signalStrength: number;
};

export type BacktestOptions = {
  initialBalance: number;
  riskPerTrade: number; // percentage of balance to risk per trade
  symbols: string[];
  timeframes: string[];
  startTime?: number;
  endTime?: number;
  strategies?: string[];
  useMacroData?: boolean;
  useStopLoss?: boolean;
  stopLossPercent?: number;
  useTakeProfit?: boolean;
  takeProfitPercent?: number;
};

// Function to run backtest
export function runBacktest(candles: Record<string, Record<string, CandleData[]>>, options: BacktestOptions): BacktestResult {
  console.log('Starting backtest with options:', options);
  // Initialize backtest variables
  let balance = options.initialBalance;
  const trades: Trade[] = [];
  const equityCurve: number[] = [balance];
  const drawdowns: number[] = [0];
  let maxBalance = balance;
  let currentDrawdown = 0;
  let maxDrawdown = 0;

  // Process each symbol
  for (const symbol in candles) {
    if (!options.symbols.includes(symbol)) continue;

    // Process each timeframe
    for (const timeframe in candles[symbol]) {
      if (!options.timeframes.includes(timeframe)) continue;

      const candleData = candles[symbol][timeframe];
      
      // Skip if not enough data
      if (candleData.length < 50) {
        console.log(`Not enough data for ${symbol} on ${timeframe} timeframe`);
        continue;
      }

      // Filter candles by time range if specified
      let filteredCandles = candleData;
      if (options.startTime) {
        filteredCandles = filteredCandles.filter(c => c.time >= options.startTime!);
      }
      if (options.endTime) {
        filteredCandles = filteredCandles.filter(c => c.time <= options.endTime!);
      }

      // Skip if not enough filtered data
      if (filteredCandles.length < 50) {
        console.log(`Not enough filtered data for ${symbol} on ${timeframe} timeframe`);
        continue;
      }

      // Initialize trade tracking variables
      let inPosition = false;
      let currentTrade: Partial<Trade> = {};

      // Process each candle
      for (let i = 50; i < filteredCandles.length; i++) {
        const currentCandle = filteredCandles[i];
        const previousCandles = filteredCandles.slice(0, i + 1);

        // Calculate signals for all strategies
        const signals: Record<string, IndicatorSignal> = {};
        
        // Only calculate signals for strategies that are enabled
        if (!options.strategies || options.strategies.includes('MeanReversion')) {
          signals['MeanReversion'] = mean_reversion_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('EMA Crossover')) {
          signals['EMA Crossover'] = ema_crossover_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('RSI Divergence')) {
          signals['RSI Divergence'] = rsi_divergence_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Bollinger Squeeze')) {
          signals['Bollinger Squeeze'] = bollinger_squeeze_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Volume Spike')) {
          signals['Volume Spike'] = volume_spike_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('ADX Trend')) {
          signals['ADX Trend'] = adx_trend_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Supertrend')) {
          signals['Supertrend'] = supertrend_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Heikin Ashi')) {
          signals['Heikin Ashi'] = heikin_ashi_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Fibonacci Retracement')) {
          signals['Fibonacci Retracement'] = fibonacci_retracement_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Fractal Breakout')) {
          signals['Fractal Breakout'] = fractal_breakout_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('CCI')) {
          signals['CCI'] = cci_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Stochastic')) {
          signals['Stochastic'] = stochastic_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Williams %R')) {
          signals['Williams %R'] = williams_r_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Parabolic SAR')) {
          signals['Parabolic SAR'] = parabolic_sar_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('VWAP')) {
          signals['VWAP'] = vwap_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Breakout')) {
          signals['Breakout'] = breakout_signal(previousCandles);
        }
        if (!options.strategies || options.strategies.includes('Momentum RSI')) {
          signals['Momentum RSI'] = momentum_rsi_signal(previousCandles);
        }

        // Combine signals
        const combinedSignal = combineSignals(signals);

        // Trading logic
        if (!inPosition) {
          // Check for entry signals
          if (combinedSignal.signal === 'buy') {
            // Calculate position size based on risk
            const risk = balance * (options.riskPerTrade / 100);
            const size = risk / currentCandle.close;

            // Enter long position
            inPosition = true;
            currentTrade = {
              entryTime: currentCandle.time,
              entryPrice: currentCandle.close,
              side: 'long',
              size,
              strategy: findStrongestStrategy(signals, 'buy'),
              signalStrength: combinedSignal.strength
            };
            console.log(`[BACKTEST] ${new Date(currentCandle.time).toISOString()} - Entered LONG position at ${currentCandle.close} with size ${size}`);
          } else if (combinedSignal.signal === 'sell') {
            // Calculate position size based on risk
            const risk = balance * (options.riskPerTrade / 100);
            const size = risk / currentCandle.close;

            // Enter short position
            inPosition = true;
            currentTrade = {
              entryTime: currentCandle.time,
              entryPrice: currentCandle.close,
              side: 'short',
              size,
              strategy: findStrongestStrategy(signals, 'sell'),
              signalStrength: combinedSignal.strength
            };
            console.log(`[BACKTEST] ${new Date(currentCandle.time).toISOString()} - Entered SHORT position at ${currentCandle.close} with size ${size}`);
          }
        } else {
          // Check for exit signals or stop loss/take profit
          let shouldExit = false;
          let exitReason = '';

          // Check for opposite signal
          if (currentTrade.side === 'long' && combinedSignal.signal === 'sell') {
            shouldExit = true;
            exitReason = 'Sell signal';
          } else if (currentTrade.side === 'short' && combinedSignal.signal === 'buy') {
            shouldExit = true;
            exitReason = 'Buy signal';
          }

          // Check stop loss if enabled
          if (options.useStopLoss && !shouldExit) {
            const stopLossPercent = options.stopLossPercent || 2;
            if (currentTrade.side === 'long' && 
                currentCandle.low < currentTrade.entryPrice! * (1 - stopLossPercent / 100)) {
              shouldExit = true;
              exitReason = 'Stop loss hit';
            } else if (currentTrade.side === 'short' && 
                       currentCandle.high > currentTrade.entryPrice! * (1 + stopLossPercent / 100)) {
              shouldExit = true;
              exitReason = 'Stop loss hit';
            }
          }

          // Check take profit if enabled
          if (options.useTakeProfit && !shouldExit) {
            const takeProfitPercent = options.takeProfitPercent || 4;
            if (currentTrade.side === 'long' && 
                currentCandle.high > currentTrade.entryPrice! * (1 + takeProfitPercent / 100)) {
              shouldExit = true;
              exitReason = 'Take profit hit';
            } else if (currentTrade.side === 'short' && 
                       currentCandle.low < currentTrade.entryPrice! * (1 - takeProfitPercent / 100)) {
              shouldExit = true;
              exitReason = 'Take profit hit';
            }
          }

          if (shouldExit) {
            // Exit position
            const exitPrice = currentCandle.close;
            const profitLoss = currentTrade.side === 'long' 
              ? (exitPrice - currentTrade.entryPrice!) * currentTrade.size!
              : (currentTrade.entryPrice! - exitPrice) * currentTrade.size!;
            
            const profitLossPercent = currentTrade.side === 'long'
              ? (exitPrice / currentTrade.entryPrice! - 1) * 100
              : (1 - exitPrice / currentTrade.entryPrice!) * 100;

            // Update balance
            balance += profitLoss;
            
            // Track max balance and drawdown
            if (balance > maxBalance) {
              maxBalance = balance;
              currentDrawdown = 0;
            } else {
              currentDrawdown = (maxBalance - balance) / maxBalance * 100;
              maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
            }

            // Log trade
            console.log(`[BACKTEST] ${new Date(currentCandle.time).toISOString()} - Exited ${currentTrade.side} position at ${exitPrice}. P/L: ${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%). Reason: ${exitReason}`);

            // Save completed trade
            const completedTrade: Trade = {
              ...currentTrade as Trade,
              exitTime: currentCandle.time,
              exitPrice,
              profitLoss,
              profitLossPercent
            };
            trades.push(completedTrade);

            // Update equity curve and drawdown
            equityCurve.push(balance);
            drawdowns.push(currentDrawdown);

            // Reset position
            inPosition = false;
            currentTrade = {};
          }
        }
      }
    }
  }

  // Calculate backtest statistics
  const stats = calculateBacktestStats(trades, options.initialBalance, maxDrawdown);

  // Find best and worst trades
  const sortedTrades = [...trades].sort((a, b) => b.profitLossPercent - a.profitLossPercent);
  const bestTrade = sortedTrades.length > 0 ? sortedTrades[0] : {} as Trade;
  const worstTrade = sortedTrades.length > 0 ? sortedTrades[sortedTrades.length - 1] : {} as Trade;

  return {
    trades,
    stats,
    equityCurve,
    drawdowns,
    bestTrade,
    worstTrade
  };
}

// Helper function to find the strongest strategy that gave a signal
function findStrongestStrategy(signals: Record<string, IndicatorSignal>, signalType: 'buy' | 'sell'): string {
  let strongestStrategy = '';
  let maxStrength = 0;

  for (const strategy in signals) {
    const signal = signals[strategy];
    if (signal.signal === signalType && signal.strength > maxStrength) {
      maxStrength = signal.strength;
      strongestStrategy = strategy;
    }
  }

  return strongestStrategy;
}

// Calculate backtest statistics
function calculateBacktestStats(trades: Trade[], initialBalance: number, maxDrawdown: number): BacktestStats {
  if (trades.length === 0) {
    return {
      startingBalance: initialBalance,
      endingBalance: initialBalance,
      totalProfit: 0,
      profitPercent: 0,
      numTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageProfit: 0,
      averageLoss: 0,
      profitFactor: 0,
      maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
      sharpeRatio: 0,
      riskRewardRatio: 0
    };
  }

  // Calculate basic statistics
  const endingBalance = initialBalance + trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const totalProfit = endingBalance - initialBalance;
  const profitPercent = (totalProfit / initialBalance) * 100;
  
  const winningTrades = trades.filter(t => t.profitLoss > 0);
  const losingTrades = trades.filter(t => t.profitLoss <= 0);
  
  const winRate = (winningTrades.length / trades.length) * 100;
  
  const totalWinnings = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
  
  const averageProfit = winningTrades.length > 0 ? totalWinnings / winningTrades.length : 0;
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
  
  const profitFactor = totalLosses > 0 ? totalWinnings / totalLosses : totalWinnings > 0 ? Infinity : 0;
  
  // Calculate Sharpe Ratio (simplified)
  const returns = trades.map(t => t.profitLossPercent / 100);
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const stdDevReturns = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
  );
  const sharpeRatio = stdDevReturns > 0 ? (meanReturn / stdDevReturns) * Math.sqrt(252) : 0; // Annualized
  
  // Risk-Reward Ratio
  const riskRewardRatio = averageLoss > 0 ? averageProfit / averageLoss : 0;
  
  return {
    startingBalance: initialBalance,
    endingBalance,
    totalProfit,
    profitPercent,
    numTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    averageProfit,
    averageLoss,
    profitFactor,
    maxDrawdown,
    maxDrawdownPercent: maxDrawdown,
    sharpeRatio,
    riskRewardRatio
  };
}

// Helper function to format backtest results for reporting
export function formatBacktestReport(result: BacktestResult): string {
  const { stats, bestTrade, worstTrade } = result;
  
  return `
=== BACKTEST RESULTS ===

Summary:
- Starting Balance: ${stats.startingBalance.toFixed(2)}
- Ending Balance: ${stats.endingBalance.toFixed(2)}
- Total Profit: ${stats.totalProfit.toFixed(2)} (${stats.profitPercent.toFixed(2)}%)
- Number of Trades: ${stats.numTrades}

Performance:
- Win Rate: ${stats.winRate.toFixed(2)}%
- Profit Factor: ${stats.profitFactor.toFixed(2)}
- Average Profit: ${stats.averageProfit.toFixed(2)}
- Average Loss: ${stats.averageLoss.toFixed(2)}
- Risk-Reward Ratio: ${stats.riskRewardRatio.toFixed(2)}
- Sharpe Ratio: ${stats.sharpeRatio.toFixed(2)}
- Max Drawdown: ${stats.maxDrawdownPercent.toFixed(2)}%

Best Trade:
- Strategy: ${bestTrade.strategy}
- Side: ${bestTrade.side}
- Profit: ${bestTrade.profitLoss?.toFixed(2) || 'N/A'} (${bestTrade.profitLossPercent?.toFixed(2) || 'N/A'}%)
- Entry: ${bestTrade.entryPrice?.toFixed(2) || 'N/A'} at ${new Date(bestTrade.entryTime || 0).toISOString()}
- Exit: ${bestTrade.exitPrice?.toFixed(2) || 'N/A'} at ${new Date(bestTrade.exitTime || 0).toISOString()}

Worst Trade:
- Strategy: ${worstTrade.strategy}
- Side: ${worstTrade.side}
- Loss: ${worstTrade.profitLoss?.toFixed(2) || 'N/A'} (${worstTrade.profitLossPercent?.toFixed(2) || 'N/A'}%)
- Entry: ${worstTrade.entryPrice?.toFixed(2) || 'N/A'} at ${new Date(worstTrade.entryTime || 0).toISOString()}
- Exit: ${worstTrade.exitPrice?.toFixed(2) || 'N/A'} at ${new Date(worstTrade.exitTime || 0).toISOString()}
`;  
}

// Send backtest report to Telegram
export async function sendBacktestReport(result: BacktestResult, telegramChatId: string): Promise<boolean> {
  try {
    const { stats, bestTrade, worstTrade } = result;
    const { sendTradeNotification } = await import('./telegram');
    
    // Format a shorter report for Telegram
    const telegramReport = {
      message: `🤖 Backtest Results 📊\n\n` +
        `💰 Profit: ${stats.totalProfit.toFixed(2)} (${stats.profitPercent.toFixed(2)}%)\n` +
        `📈 Trades: ${stats.numTrades} (${stats.winRate.toFixed(1)}% win rate)\n` +
        `📉 Max Drawdown: ${stats.maxDrawdownPercent.toFixed(2)}%\n\n` +
        `🏆 Best Strategy: ${getBestPerformingStrategy(result.trades)}\n` +
        `⚡ Best Trade: ${bestTrade.strategy} - ${bestTrade.profitLossPercent?.toFixed(2)}%\n` +
        `🔴 Worst Trade: ${worstTrade.strategy} - ${worstTrade.profitLossPercent?.toFixed(2)}%`,
      context: `Backtest from ${new Date(result.trades[0]?.entryTime || Date.now()).toLocaleDateString()} to ${new Date(result.trades[result.trades.length - 1]?.exitTime || Date.now()).toLocaleDateString()}`
    };
    
    const { sendErrorNotification } = await import('./telegram');
    await sendErrorNotification(telegramChatId, telegramReport);
    
    return true;
  } catch (error) {
    console.error('Failed to send backtest report to Telegram:', error);
    return false;
  }
}

// Helper function to determine the best performing strategy
function getBestPerformingStrategy(trades: Trade[]): string {
  // Group trades by strategy
  const strategyPerformance: Record<string, { trades: number, wins: number, totalProfit: number }> = {};
  
  for (const trade of trades) {
    if (!strategyPerformance[trade.strategy]) {
      strategyPerformance[trade.strategy] = { trades: 0, wins: 0, totalProfit: 0 };
    }
    
    strategyPerformance[trade.strategy].trades += 1;
    if (trade.profitLoss > 0) {
      strategyPerformance[trade.strategy].wins += 1;
    }
    strategyPerformance[trade.strategy].totalProfit += trade.profitLoss;
  }
  
  // Find best strategy by profit
  let bestStrategy = '';
  let bestProfit = -Infinity;
  
  for (const strategy in strategyPerformance) {
    if (strategyPerformance[strategy].totalProfit > bestProfit && strategyPerformance[strategy].trades >= 5) {
      bestProfit = strategyPerformance[strategy].totalProfit;
      bestStrategy = strategy;
    }
  }
  
  return bestStrategy || 'None';
}
