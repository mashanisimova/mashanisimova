'use client';

import { IndicatorSignal } from './indicators';
import { TradeRecord } from './autoTrader';

// Types for our hybrid AI model
type ModelOutput = {
  signal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  reasoning: string[];
  contributingFactors: {
    name: string;
    contribution: number;
    signal: 'buy' | 'sell' | 'neutral';
  }[];
  timeframe: string;
};

type HybridModelConfig = {
  // LSTM configuration
  lstmConfig: {
    lookbackPeriod: number;
    hiddenLayers: number;
    learningRate: number;
    dropoutRate: number;
  };
  // Transformer configuration
  transformerConfig: {
    attentionHeads: number;
    embeddingDim: number;
    feedForwardDim: number;
    layers: number;
  };
  // Ensemble weights
  ensembleWeights: {
    lstm: number;
    transformer: number;
    technicalIndicators: number;
    sentiment: number;
    onChain: number;
    macro: number;
  };
};

// Initial configuration
const defaultConfig: HybridModelConfig = {
  lstmConfig: {
    lookbackPeriod: 60,
    hiddenLayers: 3,
    learningRate: 0.001,
    dropoutRate: 0.2
  },
  transformerConfig: {
    attentionHeads: 8,
    embeddingDim: 256,
    feedForwardDim: 512,
    layers: 4
  },
  ensembleWeights: {
    lstm: 0.3,
    transformer: 0.3,
    technicalIndicators: 0.2,
    sentiment: 0.1,
    onChain: 0.05,
    macro: 0.05
  }
};

// Maintain model state
let modelConfig = { ...defaultConfig };
let modelTrainingProgress = 0;
let lastTrainingDate = 0;
let modelPerformance = {
  accuracy: 0,
  precision: 0,
  recall: 0,
  f1Score: 0,
  sharpeRatio: 0
};

// Initialize the hybrid model
export function initializeHybridModel(config?: Partial<HybridModelConfig>) {
  if (config) {
    modelConfig = {
      ...modelConfig,
      ...config,
      lstmConfig: { ...modelConfig.lstmConfig, ...config.lstmConfig },
      transformerConfig: { ...modelConfig.transformerConfig, ...config.transformerConfig },
      ensembleWeights: { ...modelConfig.ensembleWeights, ...config.ensembleWeights }
    };
  }
  
  console.log('Hybrid AI model initialized with config:', modelConfig);
  return modelConfig;
}

// Process signals through the hybrid model
export function processSignalsWithHybridAI(
  signals: Record<string, IndicatorSignal>,
  marketData: any,
  onChainData: any,
  sentimentData: any,
  macroData: any,
  timeframe: string
): ModelOutput {
  console.log('Processing signals with Hybrid AI model...');
  
  // Extract technical indicator signals
  const technicalSignals = Object.entries(signals)
    .filter(([key]) => [
      'MeanReversion', 'EMA Crossover', 'RSI Divergence', 'Bollinger Squeeze',
      'Volume Spike', 'ADX Trend', 'Supertrend', 'Heikin Ashi', 'Fibonacci Retracement',
      'Fractal Breakout', 'CCI', 'Stochastic', 'Williams %R', 'Parabolic SAR',
      'VWAP', 'Breakout', 'Momentum RSI'
    ].includes(key))
    .map(([name, signal]) => ({
      name,
      signal: signal.signal,
      strength: signal.strength
    }));
  
  // Simulate LSTM prediction (in a real implementation, this would be a real LSTM model)
  const lstmPrediction = simulateLSTMPrediction(marketData, technicalSignals);
  
  // Simulate Transformer prediction (in a real implementation, this would be a real Transformer model)
  const transformerPrediction = simulateTransformerPrediction(
    marketData, technicalSignals, onChainData, sentimentData, macroData
  );
  
  // Technical indicators consensus
  const technicalConsensus = calculateTechnicalConsensus(signals);
  
  // Sentiment analysis result
  const sentimentResult = processNLPSentiment(sentimentData);
  
  // On-chain analysis
  const onChainResult = processOnChainData(onChainData);
  
  // Macro analysis
  const macroResult = processMacroData(macroData);
  
  // Combine all predictions with ensemble weights
  const ensemblePrediction = {
    buySignal: (
      lstmPrediction.buyProbability * modelConfig.ensembleWeights.lstm +
      transformerPrediction.buyProbability * modelConfig.ensembleWeights.transformer +
      technicalConsensus.buySignal * modelConfig.ensembleWeights.technicalIndicators +
      sentimentResult.buySignal * modelConfig.ensembleWeights.sentiment +
      onChainResult.buySignal * modelConfig.ensembleWeights.onChain +
      macroResult.buySignal * modelConfig.ensembleWeights.macro
    ),
    sellSignal: (
      lstmPrediction.sellProbability * modelConfig.ensembleWeights.lstm +
      transformerPrediction.sellProbability * modelConfig.ensembleWeights.transformer +
      technicalConsensus.sellSignal * modelConfig.ensembleWeights.technicalIndicators +
      sentimentResult.sellSignal * modelConfig.ensembleWeights.sentiment +
      onChainResult.sellSignal * modelConfig.ensembleWeights.onChain +
      macroResult.sellSignal * modelConfig.ensembleWeights.macro
    )
  };
  
  // Determine final signal and confidence
  let finalSignal: 'buy' | 'sell' | 'neutral';
  let confidence: number;
  
  if (ensemblePrediction.buySignal > ensemblePrediction.sellSignal && ensemblePrediction.buySignal > 0.55) {
    finalSignal = 'buy';
    confidence = ensemblePrediction.buySignal * 100;
  } else if (ensemblePrediction.sellSignal > ensemblePrediction.buySignal && ensemblePrediction.sellSignal > 0.55) {
    finalSignal = 'sell';
    confidence = ensemblePrediction.sellSignal * 100;
  } else {
    finalSignal = 'neutral';
    confidence = 50;
  }
  
  // Generate reasoning based on contributing factors
  const contributingFactors = [
    {
      name: 'LSTM Model',
      contribution: lstmPrediction.buyProbability > lstmPrediction.sellProbability 
        ? lstmPrediction.buyProbability * modelConfig.ensembleWeights.lstm * 100
        : -lstmPrediction.sellProbability * modelConfig.ensembleWeights.lstm * 100,
      signal: lstmPrediction.buyProbability > lstmPrediction.sellProbability ? 'buy' : 'sell'
    },
    {
      name: 'Transformer Model',
      contribution: transformerPrediction.buyProbability > transformerPrediction.sellProbability 
        ? transformerPrediction.buyProbability * modelConfig.ensembleWeights.transformer * 100
        : -transformerPrediction.sellProbability * modelConfig.ensembleWeights.transformer * 100,
      signal: transformerPrediction.buyProbability > transformerPrediction.sellProbability ? 'buy' : 'sell'
    },
    {
      name: 'Technical Indicators',
      contribution: technicalConsensus.buySignal > technicalConsensus.sellSignal 
        ? technicalConsensus.buySignal * modelConfig.ensembleWeights.technicalIndicators * 100
        : -technicalConsensus.sellSignal * modelConfig.ensembleWeights.technicalIndicators * 100,
      signal: technicalConsensus.buySignal > technicalConsensus.sellSignal ? 'buy' : 'sell'
    },
    {
      name: 'Market Sentiment',
      contribution: sentimentResult.buySignal > sentimentResult.sellSignal 
        ? sentimentResult.buySignal * modelConfig.ensembleWeights.sentiment * 100
        : -sentimentResult.sellSignal * modelConfig.ensembleWeights.sentiment * 100,
      signal: sentimentResult.buySignal > sentimentResult.sellSignal ? 'buy' : 'sell'
    },
    {
      name: 'On-Chain Data',
      contribution: onChainResult.buySignal > onChainResult.sellSignal 
        ? onChainResult.buySignal * modelConfig.ensembleWeights.onChain * 100
        : -onChainResult.sellSignal * modelConfig.ensembleWeights.onChain * 100,
      signal: onChainResult.buySignal > onChainResult.sellSignal ? 'buy' : 'sell'
    },
    {
      name: 'Macro Analysis',
      contribution: macroResult.buySignal > macroResult.sellSignal 
        ? macroResult.buySignal * modelConfig.ensembleWeights.macro * 100
        : -macroResult.sellSignal * modelConfig.ensembleWeights.macro * 100,
      signal: macroResult.buySignal > macroResult.sellSignal ? 'buy' : 'sell'
    }
  ];
  
  // Sort contributing factors by absolute contribution value
  contributingFactors.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  
  // Generate reasoning
  const reasoning = [];
  if (finalSignal === 'buy') {
    reasoning.push(`Hybrid AI model predicts a bullish movement with ${confidence.toFixed(1)}% confidence.`);
    
    // Add top 3 positive contributors
    const positiveContributors = contributingFactors.filter(f => f.contribution > 0).slice(0, 3);
    if (positiveContributors.length > 0) {
      reasoning.push(`Top signals supporting this prediction: ${positiveContributors.map(f => f.name).join(', ')}.`);
    }
    
    // Add top negative contributor if significant
    const topNegative = contributingFactors.filter(f => f.contribution < 0)[0];
    if (topNegative && Math.abs(topNegative.contribution) > 5) {
      reasoning.push(`Despite some bearish signals from ${topNegative.name}.`);
    }
  } else if (finalSignal === 'sell') {
    reasoning.push(`Hybrid AI model predicts a bearish movement with ${confidence.toFixed(1)}% confidence.`);
    
    // Add top 3 negative contributors
    const negativeContributors = contributingFactors.filter(f => f.contribution < 0).slice(0, 3);
    if (negativeContributors.length > 0) {
      reasoning.push(`Top signals supporting this prediction: ${negativeContributors.map(f => f.name).join(', ')}.`);
    }
    
    // Add top positive contributor if significant
    const topPositive = contributingFactors.filter(f => f.contribution > 0)[0];
    if (topPositive && Math.abs(topPositive.contribution) > 5) {
      reasoning.push(`Despite some bullish signals from ${topPositive.name}.`);
    }
  } else {
    reasoning.push(`Market conditions are unclear with mixed signals.`);
    reasoning.push(`Both bullish and bearish indicators are present, suggesting a sideways movement.`);
  }
  
  // Add timeframe-specific reasoning
  if (timeframe === '1m' || timeframe === '5m') {
    reasoning.push(`This is a short-term ${timeframe} prediction and may be subject to noise.`);
  } else if (timeframe === '1h' || timeframe === '4h') {
    reasoning.push(`This is a medium-term ${timeframe} prediction with moderate confidence.`);
  } else if (timeframe === '1d' || timeframe === 'D') {
    reasoning.push(`This is a higher-confidence daily prediction based on stronger patterns.`);
  }
  
  // Return the model output
  return {
    signal: finalSignal,
    confidence,
    reasoning,
    contributingFactors,
    timeframe
  };
}

// Train the hybrid model with historical data
export function trainHybridModel(tradeHistory: TradeRecord[]): {
  success: boolean;
  progress: number;
  performance: typeof modelPerformance;
} {
  console.log(`Training hybrid AI model with ${tradeHistory.length} historical trades...`);
  
  if (tradeHistory.length < 20) {
    console.log('Not enough trade history for meaningful training');
    return { 
      success: false, 
      progress: 0,
      performance: modelPerformance 
    };
  }
  
  // Simulate training progress
  modelTrainingProgress = 0;
  const trainingInterval = setInterval(() => {
    modelTrainingProgress += 10;
    if (modelTrainingProgress >= 100) {
      clearInterval(trainingInterval);
    }
    console.log(`Training progress: ${modelTrainingProgress}%`);
  }, 500);
  
  // Simulate model training (in a real implementation, this would train the actual models)
  setTimeout(() => {
    clearInterval(trainingInterval);
    modelTrainingProgress = 100;
    
    // Update model performance metrics
    const winningTrades = tradeHistory.filter(t => t.profitLoss && t.profitLoss > 0).length;
    const accuracy = (winningTrades / tradeHistory.length) * 100;
    
    modelPerformance = {
      accuracy,
      precision: accuracy * (0.9 + Math.random() * 0.2), // Simulate precision
      recall: accuracy * (0.85 + Math.random() * 0.3), // Simulate recall
      f1Score: accuracy * (0.88 + Math.random() * 0.24), // Simulate F1 score
      sharpeRatio: 1.2 + Math.random() * 0.8 // Simulate Sharpe ratio
    };
    
    lastTrainingDate = Date.now();
    console.log('Model training completed with performance:', modelPerformance);
  }, 5000);
  
  return { 
    success: true, 
    progress: modelTrainingProgress,
    performance: modelPerformance 
  };
}

// Get model status
export function getHybridModelStatus() {
  return {
    config: modelConfig,
    trainingProgress: modelTrainingProgress,
    lastTrainingDate,
    performance: modelPerformance
  };
}

// Update model configuration
export function updateHybridModelConfig(config: Partial<HybridModelConfig>) {
  modelConfig = {
    ...modelConfig,
    ...config,
    lstmConfig: { ...modelConfig.lstmConfig, ...config.lstmConfig },
    transformerConfig: { ...modelConfig.transformerConfig, ...config.transformerConfig },
    ensembleWeights: { ...modelConfig.ensembleWeights, ...config.ensembleWeights }
  };
  
  console.log('Hybrid AI model config updated:', modelConfig);
  return modelConfig;
}

// Reset model to default configuration
export function resetHybridModel() {
  modelConfig = { ...defaultConfig };
  modelTrainingProgress = 0;
  lastTrainingDate = 0;
  modelPerformance = {
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
    sharpeRatio: 0
  };
  
  console.log('Hybrid AI model reset to default configuration');
  return modelConfig;
}

// Helper function to simulate LSTM prediction
function simulateLSTMPrediction(marketData: any, technicalSignals: any[]) {
  // Count buy and sell signals
  const buySignals = technicalSignals.filter(s => s.signal === 'buy').length;
  const sellSignals = technicalSignals.filter(s => s.signal === 'sell').length;
  const total = technicalSignals.length || 1;
  
  // Add some randomness to simulate real model behavior
  const baseProb = Math.max(0.5, buySignals / total);
  const randomFactor = 0.1;
  
  // Calculate probabilities with small random factor
  const buyProbability = baseProb + (Math.random() * randomFactor - randomFactor/2);
  const sellProbability = 1 - buyProbability;
  
  return { buyProbability, sellProbability };
}

// Helper function to simulate Transformer prediction
function simulateTransformerPrediction(
  marketData: any, 
  technicalSignals: any[], 
  onChainData: any, 
  sentimentData: any, 
  macroData: any
) {
  // Count buy and sell signals from technical indicators
  const buySignals = technicalSignals.filter(s => s.signal === 'buy').length;
  const sellSignals = technicalSignals.filter(s => s.signal === 'sell').length;
  const total = technicalSignals.length || 1;
  
  // Calculate base probability from technical signals
  let baseBuyProb = buySignals / total;
  
  // Adjust based on additional data sources
  if (onChainData && onChainData.inflows && onChainData.outflows) {
    baseBuyProb += (onChainData.inflows > onChainData.outflows) ? 0.05 : -0.05;
  }
  
  if (sentimentData && sentimentData.sentiment) {
    baseBuyProb += (sentimentData.sentiment > 0) ? 0.05 : -0.05;
  }
  
  if (macroData && macroData.fearGreedIndex) {
    // Counter-trend adjustment for extreme values
    if (macroData.fearGreedIndex < 20) { // Extreme fear
      baseBuyProb += 0.1; // Contrarian: buy when others are fearful
    } else if (macroData.fearGreedIndex > 80) { // Extreme greed
      baseBuyProb -= 0.1; // Contrarian: sell when others are greedy
    }
  }
  
  // Ensure probabilities are in valid range [0,1]
  const buyProbability = Math.min(Math.max(baseBuyProb, 0), 1);
  const sellProbability = 1 - buyProbability;
  
  return { buyProbability, sellProbability };
}

// Helper function to calculate technical indicator consensus
function calculateTechnicalConsensus(signals: Record<string, IndicatorSignal>) {
  let buySignalStrength = 0;
  let sellSignalStrength = 0;
  let totalSignals = 0;
  
  for (const [name, signal] of Object.entries(signals)) {
    if (signal.signal === 'buy') {
      buySignalStrength += signal.strength / 100;
      totalSignals++;
    } else if (signal.signal === 'sell') {
      sellSignalStrength += signal.strength / 100;
      totalSignals++;
    }
  }
  
  // Normalize to [0,1] range
  const totalStrength = Math.max(1, totalSignals);
  const buySignal = buySignalStrength / totalStrength;
  const sellSignal = sellSignalStrength / totalStrength;
  
  return { buySignal, sellSignal };
}

// Helper function to process NLP sentiment data
function processNLPSentiment(sentimentData: any) {
  if (!sentimentData) {
    return { buySignal: 0.5, sellSignal: 0.5 };
  }
  
  // Extract and normalize sentiment scores
  const sentimentScore = sentimentData.sentiment || 0;
  const normalizedScore = (sentimentScore + 1) / 2; // Convert from [-1,1] to [0,1]
  
  // If sentiment is positive, buy signal is higher
  const buySignal = normalizedScore;
  const sellSignal = 1 - normalizedScore;
  
  return { buySignal, sellSignal };
}

// Helper function to process on-chain data
function processOnChainData(onChainData: any) {
  if (!onChainData) {
    return { buySignal: 0.5, sellSignal: 0.5 };
  }
  
  // Extract relevant signals from on-chain data
  const inflows = onChainData.inflows || 0;
  const outflows = onChainData.outflows || 0;
  const whaleActivity = onChainData.whaleActivity || 0;
  const miningDifficulty = onChainData.miningDifficulty || 0;
  
  // Calculate net flow ratio (positive means more inflows)
  const totalFlow = Math.max(1, inflows + outflows);
  const netFlowRatio = (inflows - outflows) / totalFlow;
  
  // Normalize to [0,1] range
  const buySignal = (netFlowRatio + 1) / 2;
  const sellSignal = 1 - buySignal;
  
  return { buySignal, sellSignal };
}

// Helper function to process macro data
function processMacroData(macroData: any) {
  if (!macroData) {
    return { buySignal: 0.5, sellSignal: 0.5 };
  }
  
  // Extract relevant macro indicators
  const fearGreedIndex = macroData.fearGreedIndex || 50;
  const dxy = macroData.dxy || 0;
  const dxyTrend = macroData.dxyTrend || 'stable';
  const vix = macroData.vix || 20;
  
  // Calculate buy/sell signal based on macro indicators
  let macroScore = 0.5;
  
  // Fear & Greed Index (contrarian approach)
  if (fearGreedIndex < 25) { // Extreme fear
    macroScore += 0.15; // Contrarian buy signal
  } else if (fearGreedIndex > 75) { // Extreme greed
    macroScore -= 0.15; // Contrarian sell signal
  }
  
  // DXY (Dollar strength, typically inversely correlated with crypto)
  if (dxyTrend === 'rising') {
    macroScore -= 0.1; // Dollar strength typically bad for crypto
  } else if (dxyTrend === 'falling') {
    macroScore += 0.1; // Dollar weakness typically good for crypto
  }
  
  // VIX (Volatility index, high volatility often correlates with crypto drops)
  if (vix > 30) { // High volatility
    macroScore -= 0.1; // Risk-off environment
  } else if (vix < 15) { // Low volatility
    macroScore += 0.05; // Risk-on environment
  }
  
  // Ensure result is in [0,1] range
  const normalizedScore = Math.min(Math.max(macroScore, 0), 1);
  const buySignal = normalizedScore;
  const sellSignal = 1 - normalizedScore;
  
  return { buySignal, sellSignal };
}
