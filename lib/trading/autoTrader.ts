'use server';

import { BybitCredentials, getKlineData, placeOrder, getWalletBalance } from '@/lib/api/bybit';
import { CandleData, IndicatorSignal, combineSignals, mean_reversion_signal, ema_crossover_signal, rsi_divergence_signal, bollinger_squeeze_signal, volume_spike_signal, adx_trend_signal, supertrend_signal, heikin_ashi_signal, fibonacci_retracement_signal, fractal_breakout_signal, cci_signal, stochastic_signal, williams_r_signal, parabolic_sar_signal, vwap_signal, breakout_signal, momentum_rsi_signal } from './indicators';
import { sendTradeNotification, sendErrorNotification, sendDailyReport } from './telegram';
import { getMacroReport, MacroReport } from './macroeconomics';
import { adjustSignalStrength, determineMarketCondition } from './aiTrader';
import { getAggregatedAnalysis } from './onchainAnalysis';
import { getMarketConditionAnalysis } from './marketPanic';
import { analyzeMarketLiquidity, detectLiquidityChanges } from './liquidityAnalysis';
import { analyzeOrderFlow, analyzeMicrostructureDivergence } from './orderflowAnalysis';
import { getMultiTimeframeCorrelationAnalysis } from './correlationAnalysis';
import { getWhaleSignals } from './whaleAnalysis';
import { getCombinedStablecoinSignal } from './stablecoinAnalysis';
import { getCombinedDerivativesSignal } from './derivativesAnalysis';
// New exclusive modules
import { getMEVSignal } from './mevMonitoring';
import { getCrossChainLiquiditySignal } from './crossChainLiquidity';
import { getFlashCrashSignal } from './flashCrashPredictor';
import { getArbitrageSignal } from './highFrequencyArbitrage';
import { getQuantumOptimizationSignal } from './quantumOptimization';
import { getSentimentSignal } from './nlpSentimentAnalysis';
// Newly added advanced modules
import { getLiquidationSignal } from './predictiveLiquidationAnalysis';
import { getInstitutionalFlowSignal } from './institutionalFlowDetection';
import { getGammaExposureSignal } from './gammaExposureTracking';
import { getZeroKnowledgePrivacySignal } from './zeroKnowledgePrivacy';
import { getRealTimeLayerZeroSignal } from './layer0Monitoring';
import { getRegulatoryComplianceSignal } from './regulatoryScanner';
import { getTokenomicsHealthSignal } from './tokenomicsHealth';
import { runReinforceLearnSignal } from './reinforcementLearning';
import Bottleneck from 'bottleneck';

// Rate limiter to prevent API abuse
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 500 // 500ms between requests
});

type AutoTraderConfig = {
  credentials: BybitCredentials;
  symbols: string[];
  timeframes: string[];
  initialBalance: number;
  riskPerTrade: number;
  telegramChatId?: string;
  useStopLoss?: boolean;
  stopLossPercent?: number;
  useTakeProfit?: boolean;
  takeProfitPercent?: number;
  useMacroData?: boolean;
  tradingEnabled: boolean;
};

export type TradeRecord = {
  symbol: string;
  timeframe: string;
  side: 'Buy' | 'Sell';
  entryPrice: number;
  exitPrice?: number;
  size: string;
  entryTime: number;
  exitTime?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  strategy: string;
  signalStrength: number;
  orderId: string;
  status: 'open' | 'closed';
};

type TraderState = {
  activeTradesBySymbol: Record<string, TradeRecord>;
  tradeHistory: TradeRecord[];
  lastCheckTime: number;
  lastMacroReport?: MacroReport;
  lastLiquidityData?: Record<string, any>;
  startBalance: number;
  currentBalance: number;
  dailyStats: {
    date: string;
    trades: number;
    winningTrades: number;
    losingTrades: number;
    profit: number;
  };
};

let traderState: TraderState = {
  activeTradesBySymbol: {},
  tradeHistory: [],
  lastCheckTime: 0,
  startBalance: 0,
  currentBalance: 0,
  dailyStats: {
    date: new Date().toISOString().split('T')[0],
    trades: 0,
    winningTrades: 0,
    losingTrades: 0,
    profit: 0
  }
};

// Initialize the auto trader
export async function initAutoTrader(config: AutoTraderConfig): Promise<{ success: boolean; message: string }> {
  try {
    console.log('Initializing auto trader with config:', { ...config, credentials: '***HIDDEN***' });
    
    // Check wallet balance to verify credentials
    const walletData = await getWalletBalance();
    if (!walletData) {
      return { success: false, message: 'Failed to fetch wallet balance. Check API credentials.' };
    }
    
    // Initialize trader state
    const balance = parseFloat(walletData?.list?.[0]?.totalEquity || '0');
    traderState = {
      activeTradesBySymbol: {},
      tradeHistory: [],
      lastCheckTime: Date.now(),
      startBalance: balance,
      currentBalance: balance,
      dailyStats: {
        date: new Date().toISOString().split('T')[0],
        trades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profit: 0
      }
    };
    
    console.log('Auto trader initialized successfully with balance:', balance);
    return { success: true, message: `Auto trader initialized successfully. Starting balance: $${balance}` };
  } catch (error: any) {
    console.error('Failed to initialize auto trader:', error);
    return { success: false, message: `Initialization failed: ${error.message}` };
  }
}

// Main function to check for trading signals and execute trades
export async function checkAndExecuteTrades(config: AutoTraderConfig): Promise<{ success: boolean; trades?: TradeRecord[]; errors?: string[] }> {
  if (!config.tradingEnabled) {
    console.log('Trading is disabled in configuration. Skipping trade execution.');
    return { success: true, trades: [] };
  }
  
  // Check for night hours (22:00 - 6:00) - disable trading during this time
  const currentHour = new Date().getHours();
  if (currentHour >= 22 || currentHour < 6) {
    console.log('Trading is disabled during night hours (22:00 - 6:00). Skipping trade execution.');
    
    // Send notification to Telegram if configured
    if (config.telegramChatId) {
      try {
        await sendErrorNotification(config.telegramChatId, {
          message: 'Trading paused - Night mode active',
          context: `Trading is disabled between 22:00 and 6:00 to avoid volatile markets. Trading will resume at 6:00.`
        });
      } catch (error) {
        console.error('Failed to send night mode notification:', error);
      }
    }
    
    return { success: true, trades: [] };
  }
  
  console.log('Checking for trading signals across', config.symbols.length, 'symbols and', config.timeframes.length, 'timeframes');
  
  const errors: string[] = [];
  const newTrades: TradeRecord[] = [];
  
  try {
    // Update current balance
    const walletData = await getWalletBalance();
    if (walletData?.list?.[0]?.totalEquity) {
      traderState.currentBalance = parseFloat(walletData.list[0].totalEquity);
    }
    
    // Check for day change and reset daily stats if needed
    const currentDate = new Date().toISOString().split('T')[0];
    if (currentDate !== traderState.dailyStats.date) {
      // Send daily report before resetting
      if (config.telegramChatId && traderState.dailyStats.trades > 0) {
        // Find best and worst trades from today
        const todayTrades = traderState.tradeHistory.filter(t => 
          t.entryTime > Date.now() - 24*60*60*1000 && t.status === 'closed'
        );
        
        let bestTrade = { profit: 0, profitPercent: 0, strategy: 'None' };
        let worstTrade = { loss: 0, lossPercent: 0, strategy: 'None' };
        
        for (const trade of todayTrades) {
          if (trade.profitLoss && trade.profitLossPercent) {
            if (trade.profitLoss > bestTrade.profit) {
              bestTrade = {
                profit: trade.profitLoss,
                profitPercent: trade.profitLossPercent,
                strategy: trade.strategy
              };
            }
            if (trade.profitLoss < worstTrade.loss) {
              worstTrade = {
                loss: trade.profitLoss,
                lossPercent: trade.profitLossPercent,
                strategy: trade.strategy
              };
            }
          }
        }
        
        // Calculate win rate
        const winRate = traderState.dailyStats.trades > 0 ? 
          (traderState.dailyStats.winningTrades / traderState.dailyStats.trades) * 100 : 0;
        
        // Calculate profit percentage
        const startOfDayBalance = traderState.currentBalance - traderState.dailyStats.profit;
        const profitPercent = startOfDayBalance > 0 ? 
          (traderState.dailyStats.profit / startOfDayBalance) * 100 : 0;
        
        // Send daily report
        await sendDailyReport(config.telegramChatId, {
          date: traderState.dailyStats.date,
          trades: traderState.dailyStats.trades,
          winningTrades: traderState.dailyStats.winningTrades,
          losingTrades: traderState.dailyStats.losingTrades,
          winRate: winRate,
          profit: traderState.dailyStats.profit,
          profitPercent: profitPercent,
          balance: traderState.currentBalance,
          bestTrade: bestTrade,
          worstTrade: worstTrade
        });
      }
      
      // Reset daily stats
      traderState.dailyStats = {
        date: currentDate,
        trades: 0,
        winningTrades: 0,
        losingTrades: 0,
        profit: 0
      };
    }
    
    // Get macro data if enabled
    let macroData: MacroReport | undefined = undefined;
    if (config.useMacroData) {
      macroData = await getMacroReport();
      console.log('Macro data report:', {
        fearIndex: macroData?.fearAndGreedIndex,
        sentiment: macroData?.marketSentiment,
        riskLevel: macroData?.riskLevel
      });
    }
    
    // Process each symbol
    for (const symbol of config.symbols) {
      // Skip if already in a position for this symbol
      if (traderState.activeTradesBySymbol[symbol]) {
        console.log(`Already in a position for ${symbol}, checking for exit signals`);
        // Check for exit signals
        await checkExitSignals(symbol, config);
        continue;
      }
      
      // Check for entry signals across timeframes
      for (const timeframe of config.timeframes) {
        try {
          // Fetch candle data
          const candleData = await limiter.schedule(() => getKlineData(symbol, timeframe, 200));
          
          if (!candleData || candleData.length < 50) {
            console.log(`Not enough data for ${symbol} on ${timeframe} timeframe. Skipping.`);
            continue;
          }
          
          // Format candle data
          const formattedCandles: CandleData[] = candleData.map((candle: any) => ({
            time: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
          }));
          
          // Calculate signals
          const signals: Record<string, IndicatorSignal> = {
            'MeanReversion': mean_reversion_signal(formattedCandles),
            'EMA Crossover': ema_crossover_signal(formattedCandles),
            'RSI Divergence': rsi_divergence_signal(formattedCandles),
            'Bollinger Squeeze': bollinger_squeeze_signal(formattedCandles),
            'Volume Spike': volume_spike_signal(formattedCandles),
            'ADX Trend': adx_trend_signal(formattedCandles),
            'Supertrend': supertrend_signal(formattedCandles),
            'Heikin Ashi': heikin_ashi_signal(formattedCandles),
            'Fibonacci Retracement': fibonacci_retracement_signal(formattedCandles),
            'Fractal Breakout': fractal_breakout_signal(formattedCandles),
            'CCI': cci_signal(formattedCandles),
            'Stochastic': stochastic_signal(formattedCandles),
            'Williams %R': williams_r_signal(formattedCandles),
            'Parabolic SAR': parabolic_sar_signal(formattedCandles),
            'VWAP': vwap_signal(formattedCandles),
            'Breakout': breakout_signal(formattedCandles),
            'Momentum RSI': momentum_rsi_signal(formattedCandles)
          };
          
          // Get advanced analysis from all sources including newly added modules
          const [
            onChainAnalysis, 
            marketConditionAnalysis, 
            liquidityAnalysis, 
            orderFlowAnalysis,
            correlationAnalysis,
            whaleSignals,
            stablecoinSignal,
            derivativesSignal,
            // New exclusive modules
            mevSignal,
            crossChainLiquiditySignal,
            flashCrashSignal,
            arbitrageSignal,
            sentimentSignal,
            // Newly added advanced modules
            liquidationSignal,
            institutionalFlowSignal,
            gammaExposureSignal
          ] = await Promise.all([
            getAggregatedAnalysis(symbol),
            getMarketConditionAnalysis(symbol, candleData, macroData),
            analyzeMarketLiquidity(symbol),
            analyzeOrderFlow(symbol, timeframe),
            getMultiTimeframeCorrelationAnalysis(symbol),
            getWhaleSignals(symbol),
            getCombinedStablecoinSignal(),
            getCombinedDerivativesSignal(symbol),
            // New exclusive modules
            getMEVSignal(),
            getCrossChainLiquiditySignal(),
            getFlashCrashSignal(symbol),
            getArbitrageSignal(),
            getSentimentSignal(),
            // Newly added advanced modules
            getLiquidationSignal(symbol, parseFloat(formattedCandles[formattedCandles.length - 1].close)),
            getInstitutionalFlowSignal(symbol.replace('USDT', '')),
            getGammaExposureSignal(symbol.replace('USDT', ''), parseFloat(formattedCandles[formattedCandles.length - 1].close))
          ]);
          
          // Get quantum optimized parameters (runs less frequently due to computational intensity)
          const timeFrameKey = timeframe.replace('1m', 'min1').replace('5m', 'min5').replace('15m', 'min15')
            .replace('30m', 'min30').replace('1h', 'hour1').replace('4h', 'hour4').replace('1d', 'day1');
          const shouldRunQuantumOpt = Date.now() % (4 * 3600 * 1000) < 10000; // Run roughly every 4 hours
          
          let quantumOptSignal;
          if (shouldRunQuantumOpt) {
            console.log(`Running quantum optimization for ${symbol}...`);
            quantumOptSignal = await getQuantumOptimizationSignal(
              ['MeanReversion', 'EMA_Crossover', 'RSI_Divergence', 'BollingerSqueeze'],
              formattedCandles
            );
            console.log(`Quantum optimization complete. Best meta-strategy: ${quantumOptSignal.metaStrategy}`);
          }
          
          // For longer timeframes, also analyze order flow microstructure divergence
          let microstructureAnalysis;
          if (timeframe === '1h' || timeframe === '4h') {
            microstructureAnalysis = await analyzeMicrostructureDivergence(symbol, ['1m', '5m', '15m', '1h']);
            console.log(`Microstructure divergence for ${symbol}: ${microstructureAnalysis.overall.signal} (${microstructureAnalysis.overall.strength.toFixed(2)}%) - ${microstructureAnalysis.overall.commentary}`);
          }
          
          // Log analysis results from all sources
          console.log(`On-chain analysis for ${symbol}: ${onChainAnalysis.combinedSignal} (${onChainAnalysis.combinedStrength.toFixed(2)}%)`);
          console.log(`Market condition analysis for ${symbol}: ${marketConditionAnalysis.combinedSignal} (${marketConditionAnalysis.combinedStrength.toFixed(2)}%)`);
          console.log(`Liquidity analysis for ${symbol}: ${liquidityAnalysis.signal} (${liquidityAnalysis.signalStrength.toFixed(2)}%) - ${liquidityAnalysis.signalDescription}`);
          console.log(`Correlation analysis for ${symbol}: ${correlationAnalysis.tradingSignal.signal} (${correlationAnalysis.tradingSignal.strength.toFixed(2)}%)`);
          console.log(`Whale activity for ${symbol}: ${whaleSignals.signal} (${whaleSignals.strength.toFixed(2)}%) - ${whaleSignals.alert}`);
          console.log(`Stablecoin analysis: ${stablecoinSignal.signal} (${stablecoinSignal.strength.toFixed(2)}%)`);
          console.log(`Derivatives analysis for ${symbol}: ${derivativesSignal.signal} (${derivativesSignal.strength.toFixed(2)}%) - Confidence: ${derivativesSignal.confidence.toFixed(2)}%`);
          
          // Log results from exclusive modules
          console.log(`MEV analysis: ${mevSignal.signal} (confidence: ${mevSignal.confidence}%) - Affected assets: ${mevSignal.affectedAssets.join(', ')}`);
          console.log(`Cross-chain liquidity: ${crossChainLiquiditySignal.signal} (confidence: ${crossChainLiquiditySignal.confidence}%) - Target assets: ${crossChainLiquiditySignal.targetAssets.map(a => a.asset).join(', ')}`);
          console.log(`Flash crash prediction for ${symbol}: ${flashCrashSignal.signal} (confidence: ${flashCrashSignal.confidence}%) - Risk level: ${flashCrashSignal.riskLevel}`);
          console.log(`Arbitrage opportunities: Exchange signal: ${arbitrageSignal.exchangeArbitrageSignal}, Triangular signal: ${arbitrageSignal.triangularArbitrageSignal}`);
          console.log(`Sentiment analysis: Market signal: ${sentimentSignal.marketSignal} (confidence: ${sentimentSignal.confidence}%) - Trend: ${sentimentSignal.trendDirection}`);
          if (quantumOptSignal) {
            console.log(`Quantum optimization: Best meta-strategy: ${quantumOptSignal.metaStrategy} (confidence: ${quantumOptSignal.confidence}%)`);
          }
          
          // Detect any suspicious liquidity changes
          if (traderState.lastLiquidityData?.[symbol]) {
            const liquidityChanges = await detectLiquidityChanges(symbol, traderState.lastLiquidityData[symbol]);
            if (liquidityChanges.suspiciousActivity.length > 0) {
              console.log(`⚠️ Suspicious liquidity activity for ${symbol}:`, liquidityChanges.suspiciousActivity.join(', '));
              console.log(`Recommended action: ${liquidityChanges.action}`);
              
              // Adjust risk based on liquidity changes
              if (liquidityChanges.action === 'caution') {
                // Reduce position size in risky conditions
                config.riskPerTrade = Math.max(config.riskPerTrade * 0.5, 0.1);
              }
            }
          }
          
          // Store current liquidity data for future comparison
          if (!traderState.lastLiquidityData) {
            traderState.lastLiquidityData = {};
          }
          traderState.lastLiquidityData[symbol] = liquidityAnalysis;
          
          // Apply on-chain and market panic analysis to signals
          for (const strategy in signals) {
            // On-chain data adjustments
            if (onChainAnalysis.combinedSignal === 'buy' && signals[strategy].signal === 'buy') {
              signals[strategy].strength *= 1 + (onChainAnalysis.combinedStrength / 200); // +0% to +50%
            } else if (onChainAnalysis.combinedSignal === 'sell' && signals[strategy].signal === 'sell') {
              signals[strategy].strength *= 1 + (onChainAnalysis.combinedStrength / 200); // +0% to +50%
            } else if (onChainAnalysis.combinedSignal !== signals[strategy].signal && onChainAnalysis.combinedStrength > 70) {
              signals[strategy].strength *= 0.7; // Reduce opposing signals
            }
            
            // Market panic/regime adjustments
            if (marketConditionAnalysis.combinedSignal === signals[strategy].signal) {
              signals[strategy].strength *= 1 + (marketConditionAnalysis.combinedStrength / 200); // +0% to +50%
              
              // Special handling for extreme market conditions
              if (marketConditionAnalysis.panicData.panicLevel === 'extreme_fear' && signals[strategy].signal === 'buy') {
                signals[strategy].strength *= 1.2; // Boost buy signals in extreme fear (contrarian)
              } else if (marketConditionAnalysis.panicData.panicLevel === 'extreme_greed' && signals[strategy].signal === 'sell') {
                signals[strategy].strength *= 1.2; // Boost sell signals in extreme greed (contrarian)
              }
              
              // Market regime specific adjustments
              if (marketConditionAnalysis.regimeData.regime === 'strong_uptrend' && signals[strategy].signal === 'buy') {
                signals[strategy].strength *= 1.3; // Strong uptrend boosts buy signals
              } else if (marketConditionAnalysis.regimeData.regime === 'strong_downtrend' && signals[strategy].signal === 'sell') {
                signals[strategy].strength *= 1.3; // Strong downtrend boosts sell signals
              } else if (marketConditionAnalysis.regimeData.regime === 'volatile') {
                signals[strategy].strength *= 0.8; // Reduce all signals in volatile markets
              }
            }
          }
          
          // Apply macro adjustments if enabled
          if (macroData && config.useMacroData) {
            // Adjust signals based on macro conditions
            for (const strategy in signals) {
              // Adjust for DXY (Dollar Index)
              if (macroData.dxy !== undefined && macroData.dxyTrend) {
                // Dollar strength typically negative for crypto
                if (macroData.dxyTrend === 'rising' && signals[strategy].signal === 'buy') {
                  signals[strategy].strength *= 0.8; // Reduce buy signal strength when dollar is rising
                } else if (macroData.dxyTrend === 'falling' && signals[strategy].signal === 'buy') {
                  signals[strategy].strength *= 1.2; // Increase buy signal when dollar is falling
                }
              }
              
              // Adjust for Fear & Greed Index
              if (macroData.fearAndGreedIndex && macroData.fearAndGreedIndex < 30 && signals[strategy].signal === 'buy') {
                signals[strategy].strength *= 1.3; // Stronger buy in extreme fear (contrarian)
              } else if (macroData.fearAndGreedIndex && macroData.fearAndGreedIndex > 70 && signals[strategy].signal === 'sell') {
                signals[strategy].strength *= 1.3; // Stronger sell in extreme greed
              }
              
              // Adjust for overall risk level
              if (macroData.riskLevel === 'high' && signals[strategy].signal === 'buy') {
                signals[strategy].strength *= 0.7; // Reduce buy signals in high risk environment
              } else if (macroData.riskLevel === 'low' && signals[strategy].signal === 'buy') {
                signals[strategy].strength *= 1.2; // Stronger buy signals in low risk environment
              }
              
              // Cap signal strength at 100
              signals[strategy].strength = Math.min(100, signals[strategy].strength);
            }
          }
          
          // Add all advanced analysis signals to the signals object
          signals['On-Chain Analysis'] = {
            signal: onChainAnalysis.combinedSignal,
            strength: onChainAnalysis.combinedStrength,
            meta: { source: 'on-chain' }
          };
          
          signals['Market Regime'] = {
            signal: marketConditionAnalysis.combinedSignal,
            strength: marketConditionAnalysis.combinedStrength,
            meta: { 
              regime: marketConditionAnalysis.regimeData.regime,
              panicLevel: marketConditionAnalysis.panicData.panicLevel
            }
          };
          
          signals['Liquidity Analysis'] = {
            signal: liquidityAnalysis.signal,
            strength: liquidityAnalysis.signalStrength,
            meta: {
              bidAskRatio: liquidityAnalysis.metrics.bidAskRatio,
              whaleActivity: liquidityAnalysis.whaleActivityDetected
            }
          };
          
          // Add new advanced signals
          signals['Correlation Analysis'] = {
            signal: correlationAnalysis.tradingSignal.signal,
            strength: correlationAnalysis.tradingSignal.strength,
            meta: { source: 'correlation' }
          };
          
          signals['Whale Activity'] = {
            signal: whaleSignals.signal,
            strength: whaleSignals.strength,
            meta: { transactions: whaleSignals.transactions.length }
          };
          
          signals['Stablecoin Flows'] = {
            signal: stablecoinSignal.signal,
            strength: stablecoinSignal.strength,
            meta: { 
              shortTerm: stablecoinSignal.shortTermSignal.signal,
              longTerm: stablecoinSignal.longTermSignal.signal 
            }
          };
          
          signals['Derivatives Data'] = {
            signal: derivativesSignal.signal,
            strength: derivativesSignal.strength,
            meta: { 
              confidence: derivativesSignal.confidence,
              signalCount: derivativesSignal.signals.length 
            }
          };
          
          // Add signals from exclusive modules
          signals['MEV Analysis'] = {
            signal: mevSignal.signal > 0 ? 'buy' : mevSignal.signal < 0 ? 'sell' : 'neutral',
            strength: Math.abs(mevSignal.signal),
            meta: { 
              confidence: mevSignal.confidence,
              volatilityPrediction: mevSignal.volatilityPrediction
            }
          };
          
          signals['Cross-Chain Liquidity'] = {
            signal: crossChainLiquiditySignal.signal > 0 ? 'buy' : crossChainLiquiditySignal.signal < 0 ? 'sell' : 'neutral',
            strength: Math.abs(crossChainLiquiditySignal.signal),
            meta: { 
              confidence: crossChainLiquiditySignal.confidence,
              targetAssets: crossChainLiquiditySignal.targetAssets.map(a => a.asset).join(',')
            }
          };
          
          signals['Flash Crash Risk'] = {
            signal: flashCrashSignal.signal > -30 ? 'neutral' : 'sell', // Only strong negative signals matter for flash crash
            strength: Math.abs(flashCrashSignal.signal),
            meta: { 
              riskLevel: flashCrashSignal.riskLevel,
              timeframe: flashCrashSignal.timeframe,
              expectedDrawdown: flashCrashSignal.expectedDrawdown
            }
          };
          
          // Arbitrage opportunities - used differently as they're executed separately
          if (arbitrageSignal.exchangeArbitrageSignal > 20 || arbitrageSignal.triangularArbitrageSignal > 20) {
            signals['Arbitrage Opportunities'] = {
              signal: 'neutral', // Arbitrage doesn't generate directional signals but affects risk/reward
              strength: Math.max(arbitrageSignal.exchangeArbitrageSignal, arbitrageSignal.triangularArbitrageSignal),
              meta: { 
                confidence: arbitrageSignal.confidence,
                opportunities: arbitrageSignal.bestOpportunities.length
              }
            };
          }
          
          // NLP Sentiment analysis
          const relevantAssetSignal = sentimentSignal.assetSignals.find(a => 
            a.asset === symbol.replace('USDT', '')
          );
          
          if (relevantAssetSignal) {
            signals['Sentiment Analysis'] = {
              signal: relevantAssetSignal.signal > 20 ? 'buy' : 
                     relevantAssetSignal.signal < -20 ? 'sell' : 'neutral',
              strength: Math.abs(relevantAssetSignal.signal),
              meta: { 
                confidence: relevantAssetSignal.confidence,
                keywords: relevantAssetSignal.keywords.join(',')
              }
            };
          } else {
            // Use market sentiment if asset-specific not available
            signals['Sentiment Analysis'] = {
              signal: sentimentSignal.marketSignal > 20 ? 'buy' : 
                     sentimentSignal.marketSignal < -20 ? 'sell' : 'neutral',
              strength: Math.abs(sentimentSignal.marketSignal),
              meta: { 
                confidence: sentimentSignal.confidence,
                trendDirection: sentimentSignal.trendDirection
              }
            };
          }
          
          // Quantum optimization - if available
          if (quantumOptSignal) {
            // Find the optimized strategy with highest expected performance
            const bestStrategy = quantumOptSignal.optimizedStrategies
              .sort((a, b) => b.expectedPerformance.sharpeRatio - a.expectedPerformance.sharpeRatio)[0];
            
            if (bestStrategy) {
              signals['Quantum Optimized'] = {
                signal: bestStrategy.expectedPerformance.returnRate > 35 ? 'buy' : 
                       bestStrategy.expectedPerformance.returnRate < 0 ? 'sell' : 'neutral',
                strength: Math.min(100, bestStrategy.expectedPerformance.returnRate),
                meta: { 
                  strategy: bestStrategy.strategy,
                  sharpeRatio: bestStrategy.expectedPerformance.sharpeRatio,
                  winRate: bestStrategy.expectedPerformance.winRate
                }
              };
            }
          }
          
          // Determine market condition for AI adjustments
          const marketCondition = determineMarketCondition(candleData, macroData?.vix || undefined);
          
          // Apply AI adjustments to signals based on past performance
          const aiAdjustedSignals = adjustSignalStrength(signals, symbol, timeframe, marketCondition);
          
          // Combine signals with macro conditions if available
          const macroConditions = macroData ? {
            fearIndex: macroData.fearAndGreedIndex || 50,
            dxy: macroData.dxy || 100,
            dxyTrend: macroData.dxyTrend || 'stable',
            vix: macroData.vix || 20,
            riskLevel: macroData.riskLevel || 'medium'
          } : undefined;
          
          // Combine adjusted signals
          const combinedSignal = combineSignals(aiAdjustedSignals, macroConditions);
          
          console.log(`${symbol} ${timeframe} signal:`, combinedSignal.signal, 'strength:', combinedSignal.strength);
          
          // Determine best strategy with highest signal strength
          let bestStrategy = '';
          let bestSignalStrength = 0;
          for (const strategy in aiAdjustedSignals) {
            if (aiAdjustedSignals[strategy].signal === combinedSignal.signal && 
                aiAdjustedSignals[strategy].strength > bestSignalStrength) {
              bestStrategy = strategy;
              bestSignalStrength = aiAdjustedSignals[strategy].strength;
            }
          }
          
          console.log(`Best strategy for ${symbol} on ${timeframe}: ${bestStrategy} with strength ${bestSignalStrength}`);
          
          // Execute trade if signal is strong enough, we have a clear best strategy, and risk level is acceptable
          if (combinedSignal.signal !== 'neutral' && bestStrategy) {
            // Check for flash crash risk - abort trading if extreme risk detected
            if (flashCrashSignal.riskLevel === 'extreme' && flashCrashSignal.confidence > 70) {
              console.log(`⚠️ ABORTING TRADE - Flash crash risk detected for ${symbol} with ${flashCrashSignal.confidence}% confidence. Expected drawdown: ${flashCrashSignal.expectedDrawdown}%`);
              
              // Send alert to Telegram if configured
              if (config.telegramChatId) {
                await sendErrorNotification(config.telegramChatId, {
                  message: `⚠️ Flash Crash Alert for ${symbol}`,
                  context: `Risk Level: ${flashCrashSignal.riskLevel}, Expected drawdown: ${flashCrashSignal.expectedDrawdown}%, Timeframe: ${flashCrashSignal.timeframe}, Confidence: ${flashCrashSignal.confidence}%`
                });
              }
              
              continue; // Skip to next timeframe
            }
            
            // Check signal strength requirements based on market conditions
            let riskLevel = macroData?.riskLevel || 'medium';
            
            // Adjust risk level based on flash crash predictor
            if (flashCrashSignal.riskLevel === 'high' && flashCrashSignal.confidence > 60) {
              riskLevel = 'high';
            } else if (flashCrashSignal.riskLevel === 'medium' && flashCrashSignal.confidence > 70) {
              riskLevel = Math.max(riskLevel === 'high' ? 2 : riskLevel === 'medium' ? 1 : 0, 1) as any; // Increase risk level by 1 step
            }
            
            const minSignalStrength = riskLevel === 'high' ? 75 : riskLevel === 'medium' ? 65 : 50;
            
            // Only trade if signal is strong enough based on current risk level
            if (combinedSignal.strength >= minSignalStrength) {
              console.log(`Trading decision for ${symbol} based on ${bestStrategy} with strength ${combinedSignal.strength} (min required: ${minSignalStrength})`);
              
              // Calculate probability of profit based on historical performance
              const historicalSuccess = traderState.tradeHistory.filter(t => 
                t.strategy === bestStrategy && t.profitLoss && t.profitLoss > 0
              ).length / Math.max(1, traderState.tradeHistory.filter(t => t.strategy === bestStrategy).length);
              
              const profitProbability = historicalSuccess * 100 || combinedSignal.strength;
              console.log(`Estimated profit probability for ${bestStrategy}: ${profitProbability.toFixed(1)}%`);
              
              // Execute trade only if probability of profit is acceptable
              if (profitProbability >= 55 || combinedSignal.strength >= 80) {
                const trade = await executeTrade(symbol, timeframe, combinedSignal, aiAdjustedSignals, config);
                if (trade) {
                  newTrades.push(trade);
                  // Only trade once per symbol, regardless of timeframe
                  break;
                }
              } else {
                console.log(`Skipping trade for ${symbol} - profit probability too low (${profitProbability.toFixed(1)}%)`);
              }
            } else {
              console.log(`Signal for ${symbol} not strong enough: ${combinedSignal.strength} < ${minSignalStrength} required`);
            }
          }
        } catch (error: any) {
          const errorMsg = `Error processing ${symbol} ${timeframe}: ${error.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          
          if (config.telegramChatId) {
            await sendErrorNotification(config.telegramChatId, {
              message: `Failed to process ${symbol} on ${timeframe}`,
              context: error.message
            });
          }
        }
      }
    }
    
    console.log('Trade check completed. New trades:', newTrades.length, 'Errors:', errors.length);
    return { success: true, trades: newTrades, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    const errorMsg = `AutoTrader error: ${error.message}`;
    console.error(errorMsg);
    
    if (config.telegramChatId) {
      await sendErrorNotification(config.telegramChatId, {
        message: 'AutoTrader execution failed',
        context: error.message
      });
    }
    
    return { success: false, errors: [errorMsg] };
  }
}

// Execute a trade based on signal
async function executeTrade(
  symbol: string,
  timeframe: string,
  signal: IndicatorSignal,
  allSignals: Record<string, IndicatorSignal>,
  config: AutoTraderConfig
): Promise<TradeRecord | null> {
  try {
    // Get current price
    const latestPrice = await getCurrentPrice(symbol);
    if (!latestPrice) throw new Error(`Failed to get current price for ${symbol}`);
    
    // Calculate position size based on risk and profit management
    let riskAmount = 0;

    // Check if we have accumulated profits to trade with
    const totalProfit = traderState.currentBalance - traderState.startBalance;
    const hasAccumulatedProfit = totalProfit > 0;

    // If we have profits, trade only with a portion of accumulated profits
    if (hasAccumulatedProfit) {
      // Use only a percentage of the accumulated profit (50%)
      riskAmount = totalProfit * 0.5 * (config.riskPerTrade / 100);
      console.log(`Trading with accumulated profit: ${totalProfit.toFixed(2)}, risk amount: ${riskAmount.toFixed(2)}`);
    } else {
      // If no accumulated profit yet, use minimal risk from initial balance (0.5%)
      riskAmount = traderState.startBalance * 0.005;
      console.log(`No accumulated profit yet. Using minimal risk amount: ${riskAmount.toFixed(2)}`);
    }
    
    // Calculate quantity based on risk
    const orderSize = (riskAmount / latestPrice).toFixed(4);
    
    // Determine trade side
    const side: 'Buy' | 'Sell' = signal.signal === 'buy' ? 'Buy' : 'Sell';
    
    // Find the strongest contributing strategy
    let strongestStrategy = 'Combined';
    let maxStrength = 0;
    for (const strategy in allSignals) {
      if (allSignals[strategy].signal === signal.signal && allSignals[strategy].strength > maxStrength) {
        maxStrength = allSignals[strategy].strength;
        strongestStrategy = strategy;
      }
    }
    
    console.log(`Executing ${side} trade for ${symbol} based on ${strongestStrategy} strategy with strength ${signal.strength}`);
    
    // Execute the order
    const orderResult = await placeOrder({
      symbol,
      side,
      orderType: 'Market',
      qty: orderSize
    });
    
    if (!orderResult || !orderResult.orderId) {
      throw new Error(`Failed to place order for ${symbol}`);
    }
    
    console.log(`Order placed successfully: ${side} ${orderSize} ${symbol} at ~${latestPrice}`);
    
    // Record the trade
    const trade: TradeRecord = {
      symbol,
      timeframe,
      side,
      entryPrice: latestPrice,
      size: orderSize,
      entryTime: Date.now(),
      strategy: strongestStrategy,
      signalStrength: signal.strength,
      orderId: orderResult.orderId,
      status: 'open'
    };
    
    // Add to active trades
    traderState.activeTradesBySymbol[symbol] = trade;
    
    // Send notification if configured
    if (config.telegramChatId) {
      await sendTradeNotification(config.telegramChatId, {
        entryTime: trade.entryTime,
        exitTime: 0,
        entryPrice: trade.entryPrice,
        exitPrice: 0,
        side: side === 'Buy' ? 'long' : 'short',
        size: parseFloat(trade.size),
        profitLoss: 0,
        profitLossPercent: 0,
        strategy: trade.strategy,
        signalStrength: trade.signalStrength
      }, {
        balance: traderState.currentBalance,
        change: ((traderState.currentBalance - traderState.startBalance) / traderState.startBalance) * 100
      });
    }
    
    return trade;
  } catch (error: any) {
    console.error(`Failed to execute trade for ${symbol}:`, error);
    return null;
  }
}

// Check for exit signals for an active trade
async function checkExitSignals(symbol: string, config: AutoTraderConfig): Promise<boolean> {
  const activeTrade = traderState.activeTradesBySymbol[symbol];
  if (!activeTrade) return false;
  
  try {
    console.log(`Checking exit signals for ${symbol} (${activeTrade.side} position)`);
    
    // Get current price
    const currentPrice = await getCurrentPrice(symbol);
    if (!currentPrice) throw new Error(`Failed to get current price for ${symbol}`);
    
    // Check for exit signals
    let shouldExit = false;
    let exitReason = '';
    
    // Get data for the timeframe used for entry
    const candleData = await limiter.schedule(() => getKlineData(symbol, activeTrade.timeframe, 200));
    
    if (candleData && candleData.length >= 50) {
      // Format candle data
      const formattedCandles: CandleData[] = candleData.map((candle: any) => ({
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      }));
      
      // Calculate signals
      const signals: Record<string, IndicatorSignal> = {
        'MeanReversion': mean_reversion_signal(formattedCandles),
        'EMA Crossover': ema_crossover_signal(formattedCandles),
        'RSI Divergence': rsi_divergence_signal(formattedCandles),
        'Bollinger Squeeze': bollinger_squeeze_signal(formattedCandles),
        'Volume Spike': volume_spike_signal(formattedCandles),
        'ADX Trend': adx_trend_signal(formattedCandles),
        'Supertrend': supertrend_signal(formattedCandles),
        'Heikin Ashi': heikin_ashi_signal(formattedCandles),
        'Fibonacci Retracement': fibonacci_retracement_signal(formattedCandles),
        'Fractal Breakout': fractal_breakout_signal(formattedCandles),
        'CCI': cci_signal(formattedCandles),
        'Stochastic': stochastic_signal(formattedCandles),
        'Williams %R': williams_r_signal(formattedCandles),
        'Parabolic SAR': parabolic_sar_signal(formattedCandles),
        'VWAP': vwap_signal(formattedCandles),
        'Breakout': breakout_signal(formattedCandles),
        'Momentum RSI': momentum_rsi_signal(formattedCandles)
      };
      
      // Get combined signal
      const combinedSignal = combineSignals(signals);
      
      // Check for opposite signal
      if ((activeTrade.side === 'Buy' && combinedSignal.signal === 'sell') ||
          (activeTrade.side === 'Sell' && combinedSignal.signal === 'buy')) {
        if (combinedSignal.strength >= 40) { // Lower threshold for exit
          shouldExit = true;
          exitReason = `Opposite signal (${combinedSignal.signal}) with strength ${combinedSignal.strength}`;
        }
      }
    }
    
    // Check stop loss if enabled
    if (!shouldExit && config.useStopLoss) {
      const stopLossPercent = config.stopLossPercent || 2;
      if (activeTrade.side === 'Buy' && 
          currentPrice < activeTrade.entryPrice * (1 - stopLossPercent / 100)) {
        shouldExit = true;
        exitReason = `Stop loss hit at ${stopLossPercent}%`;
      } else if (activeTrade.side === 'Sell' && 
                currentPrice > activeTrade.entryPrice * (1 + stopLossPercent / 100)) {
        shouldExit = true;
        exitReason = `Stop loss hit at ${stopLossPercent}%`;
      }
    }
    
    // Check take profit if enabled
    if (!shouldExit && config.useTakeProfit) {
      const takeProfitPercent = config.takeProfitPercent || 4;
      if (activeTrade.side === 'Buy' && 
          currentPrice > activeTrade.entryPrice * (1 + takeProfitPercent / 100)) {
        shouldExit = true;
        exitReason = `Take profit hit at +${takeProfitPercent}%`;
      } else if (activeTrade.side === 'Sell' && 
                currentPrice < activeTrade.entryPrice * (1 - takeProfitPercent / 100)) {
        shouldExit = true;
        exitReason = `Take profit hit at +${takeProfitPercent}%`;
      }
    }
    
    // Exit position if signals indicate
    if (shouldExit) {
      console.log(`Exiting ${symbol} position. Reason: ${exitReason}`);
      
      // Execute the exit order (opposite of entry)
      const exitSide = activeTrade.side === 'Buy' ? 'Sell' : 'Buy';
      const orderResult = await placeOrder({
        symbol,
        side: exitSide,
        orderType: 'Market',
        qty: activeTrade.size
      });
      
      if (!orderResult || !orderResult.orderId) {
        throw new Error(`Failed to place exit order for ${symbol}`);
      }
      
      // Calculate P/L
      const profitLoss = activeTrade.side === 'Buy'
        ? (currentPrice - activeTrade.entryPrice) * parseFloat(activeTrade.size)
        : (activeTrade.entryPrice - currentPrice) * parseFloat(activeTrade.size);
      
      const profitLossPercent = activeTrade.side === 'Buy'
        ? ((currentPrice / activeTrade.entryPrice) - 1) * 100
        : ((activeTrade.entryPrice / currentPrice) - 1) * 100;
      
      // Update trade record
      const completedTrade: TradeRecord = {
        ...activeTrade,
        exitPrice: currentPrice,
        exitTime: Date.now(),
        profitLoss,
        profitLossPercent,
        status: 'closed'
      };
      
      // Remove from active trades and add to history
      delete traderState.activeTradesBySymbol[symbol];
      traderState.tradeHistory.push(completedTrade);
      
      // Update daily stats
      traderState.dailyStats.trades += 1;
      if (profitLoss > 0) {
        traderState.dailyStats.winningTrades += 1;
      } else {
        traderState.dailyStats.losingTrades += 1;
      }
      traderState.dailyStats.profit += profitLoss;
      
      // Send notification if configured
      if (config.telegramChatId) {
        await sendTradeNotification(config.telegramChatId, {
          entryTime: completedTrade.entryTime,
          exitTime: completedTrade.exitTime!,
          entryPrice: completedTrade.entryPrice,
          exitPrice: completedTrade.exitPrice!,
          side: completedTrade.side === 'Buy' ? 'long' : 'short',
          size: parseFloat(completedTrade.size),
          profitLoss: completedTrade.profitLoss!,
          profitLossPercent: completedTrade.profitLossPercent!,
          strategy: completedTrade.strategy,
          signalStrength: completedTrade.signalStrength
        }, {
          balance: traderState.currentBalance,
          change: ((traderState.currentBalance - traderState.startBalance) / traderState.startBalance) * 100
        });
      }
      
      console.log(`Exited ${symbol} position with P/L: ${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error(`Error checking exit signals for ${symbol}:`, error);
    return false;
  }
}

// Helper function to get current price for a symbol
async function getCurrentPrice(symbol: string): Promise<number | null> {
  try {
    const candleData = await limiter.schedule(() => getKlineData(symbol, '1', 1));
    if (candleData && candleData.length > 0) {
      return parseFloat(candleData[0][4]); // Close price of the latest candle
    }
    return null;
  } catch (error) {
    console.error(`Failed to get current price for ${symbol}:`, error);
    return null;
  }
}

// Get trader state
export function getTraderState(): TraderState {
  return traderState;
}

// Reset trader state
export function resetTraderState(): void {
  traderState = {
    activeTradesBySymbol: {},
    tradeHistory: [],
    lastCheckTime: 0,
    lastMacroReport: undefined,
    startBalance: 0,
    currentBalance: 0,
    dailyStats: {
      date: new Date().toISOString().split('T')[0],
      trades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profit: 0
    }
  };
}
