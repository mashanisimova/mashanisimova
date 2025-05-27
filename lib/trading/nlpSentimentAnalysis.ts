/**
 * NLP Sentiment Analysis Module
 * 
 * This module uses Natural Language Processing to analyze sentiment from Twitter,
 * Reddit, news articles, and other text sources to predict market movements based
 * on social sentiment and media coverage.
 */

export interface SentimentData {
  source: 'twitter' | 'reddit' | 'news' | 'telegram' | 'discord' | 'youtube';
  asset: string;
  sentiment: number; // -100 to 100 scale
  volume: number; // relative to normal
  timestamp: number;
  keyPhrases: string[];
  influencerImpact: number; // 0-100 scale
  confidence: number; // 0-100 scale
}

export interface MediaCoverage {
  asset: string;
  totalMentions: number;
  mentionsChange24h: number; // percentage
  sentimentAverage: number; // -100 to 100 scale
  sentimentChange24h: number;
  topSources: string[];
  topKeywords: string[];
  viralityScore: number; // 0-100 scale
  timestamp: number;
}

export interface SentimentAnalysisResult {
  assets: {
    [symbol: string]: {
      overallSentiment: number; // -100 to 100 scale
      sentimentBySource: { [source: string]: number };
      volumeBySource: { [source: string]: number };
      keyPhrases: string[];
      mediaAttention: number; // 0-100 scale
      confidence: number; // 0-100 scale
    };
  };
  marketSentiment: {
    overall: number; // -100 to 100 scale
    byCategory: {
      bitcoin: number;
      ethereum: number;
      altcoins: number;
      defi: number;
      nfts: number;
      stablecoins: number;
    };
  };
  trendingTopics: string[];
  viralityAlerts: {
    topic: string;
    viralityScore: number;
    sentiment: number;
    potentialImpact: 'low' | 'medium' | 'high' | 'extreme';
  }[];
  timestamp: number;
}

/**
 * Analyzes sentiment data from various sources
 * @param assets List of assets to analyze
 * @returns Comprehensive sentiment analysis results
 */
export async function analyzeSentiment(assets: string[]): Promise<SentimentAnalysisResult> {
  console.log(`Analyzing sentiment for ${assets.join(', ')}`);
  
  // In a real implementation, this would fetch data from Twitter, Reddit, news APIs, etc.,
  // and run NLP analysis using a sentiment analysis model
  
  // Simulated sentiment data for the trading bot
  const sentimentData: SentimentData[] = generateSentimentData(assets);
  const mediaCoverage: MediaCoverage[] = generateMediaCoverageData(assets);
  
  // Process sentiment data by asset
  const assetSentiments: {
    [symbol: string]: {
      overallSentiment: number;
      sentimentBySource: { [source: string]: number };
      volumeBySource: { [source: string]: number };
      keyPhrases: string[];
      mediaAttention: number;
      confidence: number;
    };
  } = {};
  
  // Initialize asset sentiments
  assets.forEach(asset => {
    assetSentiments[asset] = {
      overallSentiment: 0,
      sentimentBySource: {},
      volumeBySource: {},
      keyPhrases: [],
      mediaAttention: 0,
      confidence: 0
    };
  });
  
  // Process sentiment data
  sentimentData.forEach(data => {
    const asset = data.asset;
    if (assetSentiments[asset]) {
      // Track sentiment by source
      if (!assetSentiments[asset].sentimentBySource[data.source]) {
        assetSentiments[asset].sentimentBySource[data.source] = data.sentiment;
        assetSentiments[asset].volumeBySource[data.source] = data.volume;
      } else {
        // Average with existing data
        const existing = assetSentiments[asset].sentimentBySource[data.source];
        assetSentiments[asset].sentimentBySource[data.source] = (existing + data.sentiment) / 2;
        
        const existingVolume = assetSentiments[asset].volumeBySource[data.source];
        assetSentiments[asset].volumeBySource[data.source] = (existingVolume + data.volume) / 2;
      }
      
      // Collect key phrases (avoid duplicates)
      data.keyPhrases.forEach(phrase => {
        if (!assetSentiments[asset].keyPhrases.includes(phrase)) {
          assetSentiments[asset].keyPhrases.push(phrase);
        }
      });
    }
  });
  
  // Process media coverage
  mediaCoverage.forEach(coverage => {
    const asset = coverage.asset;
    if (assetSentiments[asset]) {
      assetSentiments[asset].mediaAttention = coverage.viralityScore;
    }
  });
  
  // Calculate overall sentiment for each asset
  Object.keys(assetSentiments).forEach(asset => {
    const sources = Object.keys(assetSentiments[asset].sentimentBySource);
    if (sources.length > 0) {
      // Weighted average based on volume and source importance
      let totalWeight = 0;
      let weightedSentiment = 0;
      let totalConfidence = 0;
      
      sources.forEach(source => {
        const sentiment = assetSentiments[asset].sentimentBySource[source];
        const volume = assetSentiments[asset].volumeBySource[source];
        const sourceWeight = getSourceWeight(source);
        const weight = sourceWeight * volume;
        
        weightedSentiment += sentiment * weight;
        totalWeight += weight;
        
        // Accumulate confidence based on source and volume
        const sourceConfidence = sourceWeight * 50 + Math.min(50, volume * 10);
        totalConfidence += sourceConfidence;
      });
      
      assetSentiments[asset].overallSentiment = totalWeight > 0 ? 
        weightedSentiment / totalWeight : 0;
      
      assetSentiments[asset].confidence = totalConfidence / sources.length;
      
      // Cap confidence at 100
      assetSentiments[asset].confidence = Math.min(100, assetSentiments[asset].confidence);
      
      // Limit key phrases to top 10
      assetSentiments[asset].keyPhrases = assetSentiments[asset].keyPhrases.slice(0, 10);
    }
  });
  
  // Calculate market-wide sentiment
  const marketSentiment = calculateMarketSentiment(assetSentiments, assets);
  
  // Identify trending topics and virality alerts
  const { trendingTopics, viralityAlerts } = identifyTrendingTopics(sentimentData, mediaCoverage);
  
  return {
    assets: assetSentiments,
    marketSentiment,
    trendingTopics,
    viralityAlerts,
    timestamp: Date.now()
  };
}

/**
 * Get NLP sentiment signal for trading decisions
 * @param assets List of assets to analyze
 * @returns Signal values and confidence
 */
export async function getSentimentSignal(assets: string[]): Promise<{
  signals: { [asset: string]: number }; // -100 to 100
  confidence: { [asset: string]: number }; // 0-100
  marketSentiment: number; // -100 to 100
  viralTopics: { topic: string; sentiment: number; impact: number }[];
  recommendations: string[];
}> {
  try {
    const sentimentAnalysis = await analyzeSentiment(assets);
    
    // Extract signals for each asset
    const signals: { [asset: string]: number } = {};
    const confidence: { [asset: string]: number } = {};
    
    assets.forEach(asset => {
      if (sentimentAnalysis.assets[asset]) {
        signals[asset] = sentimentAnalysis.assets[asset].overallSentiment;
        confidence[asset] = sentimentAnalysis.assets[asset].confidence;
      } else {
        signals[asset] = 0;
        confidence[asset] = 0;
      }
    });
    
    // Extract market sentiment
    const marketSentiment = sentimentAnalysis.marketSentiment.overall;
    
    // Extract viral topics with potential impact
    const viralTopics = sentimentAnalysis.viralityAlerts.map(alert => ({
      topic: alert.topic,
      sentiment: alert.sentiment,
      impact: mapImpactToNumber(alert.potentialImpact)
    }));
    
    // Generate recommendations based on sentiment analysis
    const recommendations = generateSentimentRecommendations(
      sentimentAnalysis,
      assets
    );
    
    return {
      signals,
      confidence,
      marketSentiment,
      viralTopics,
      recommendations
    };
  } catch (error) {
    console.error('Error in sentiment signal generation:', error);
    return {
      signals: Object.fromEntries(assets.map(asset => [asset, 0])),
      confidence: Object.fromEntries(assets.map(asset => [asset, 0])),
      marketSentiment: 0,
      viralTopics: [],
      recommendations: ['Error analyzing sentiment data']
    };
  }
}

/* Helper functions */

/**
 * Simulates sentiment data for assets
 */
function generateSentimentData(assets: string[]): SentimentData[] {
  const sources: ('twitter' | 'reddit' | 'news' | 'telegram' | 'discord' | 'youtube')[] = [
    'twitter', 'reddit', 'news', 'telegram', 'discord', 'youtube'
  ];
  
  const data: SentimentData[] = [];
  
  assets.forEach(asset => {
    // Create different sentiment profiles for different assets
    let baseSentiment: number;
    let baseVolume: number;
    
    switch (asset) {
      case 'BTC':
        baseSentiment = 35 + Math.random() * 20;
        baseVolume = 1.2 + Math.random() * 0.5;
        break;
      case 'ETH':
        baseSentiment = 40 + Math.random() * 25;
        baseVolume = 1.4 + Math.random() * 0.6;
        break;
      case 'SOL':
        baseSentiment = 50 + Math.random() * 30;
        baseVolume = 2.0 + Math.random() * 1.0;
        break;
      case 'BNB':
        baseSentiment = 20 + Math.random() * 20;
        baseVolume = 0.8 + Math.random() * 0.4;
        break;
      default:
        baseSentiment = 10 + Math.random() * 40;
        baseVolume = 0.6 + Math.random() * 0.8;
    }
    
    // Generate sentiment data for each source
    sources.forEach(source => {
      // Adjust sentiment and volume based on the source
      let sentiment = baseSentiment;
      let volume = baseVolume;
      
      // Twitter tends to be more volatile
      if (source === 'twitter') {
        sentiment += (Math.random() * 30) - 15;
        volume *= 1.5;
      }
      
      // Reddit can be more negative
      if (source === 'reddit') {
        sentiment -= Math.random() * 20;
        volume *= 1.2;
      }
      
      // News can be more balanced
      if (source === 'news') {
        sentiment = (sentiment * 0.7) + (Math.random() * 20 - 10);
        volume *= 0.8;
      }
      
      // Cap sentiment at -100 to 100
      sentiment = Math.max(-100, Math.min(100, sentiment));
      
      // Generate random key phrases relevant to the asset
      const keyPhrases = generateKeyPhrases(asset, sentiment > 0);
      
      // Generate influencer impact based on source
      const influencerImpact = source === 'twitter' || source === 'youtube' ? 
        50 + Math.random() * 50 : 20 + Math.random() * 30;
      
      // Generate confidence based on volume and source
      const confidence = 40 + (volume * 10) + (Math.random() * 20);
      
      data.push({
        source,
        asset,
        sentiment,
        volume,
        timestamp: Date.now() - Math.floor(Math.random() * 86400000), // Last 24 hours
        keyPhrases,
        influencerImpact,
        confidence: Math.min(100, confidence)
      });
    });
  });
  
  return data;
}

/**
 * Simulates media coverage data for assets
 */
function generateMediaCoverageData(assets: string[]): MediaCoverage[] {
  return assets.map(asset => {
    // Different coverage profiles for different assets
    let totalMentions: number;
    let mentionsChange: number;
    let sentimentAverage: number;
    let viralityScore: number;
    
    switch (asset) {
      case 'BTC':
        totalMentions = 15000 + Math.floor(Math.random() * 5000);
        mentionsChange = 5 + Math.random() * 15;
        sentimentAverage = 25 + Math.random() * 20;
        viralityScore = 75 + Math.random() * 15;
        break;
      case 'ETH':
        totalMentions = 12000 + Math.floor(Math.random() * 4000);
        mentionsChange = 10 + Math.random() * 20;
        sentimentAverage = 30 + Math.random() * 25;
        viralityScore = 70 + Math.random() * 20;
        break;
      case 'SOL':
        totalMentions = 8000 + Math.floor(Math.random() * 3000);
        mentionsChange = 25 + Math.random() * 30;
        sentimentAverage = 40 + Math.random() * 30;
        viralityScore = 85 + Math.random() * 15;
        break;
      case 'BNB':
        totalMentions = 5000 + Math.floor(Math.random() * 2000);
        mentionsChange = 5 + Math.random() * 15;
        sentimentAverage = 15 + Math.random() * 20;
        viralityScore = 50 + Math.random() * 20;
        break;
      default:
        totalMentions = 2000 + Math.floor(Math.random() * 3000);
        mentionsChange = Math.random() * 40 - 10;
        sentimentAverage = Math.random() * 60 - 20;
        viralityScore = 30 + Math.random() * 40;
    }
    
    // Generate top sources
    const topSources = [
      'Twitter',
      'CoinDesk',
      'Reddit r/cryptocurrency',
      'Bloomberg',
      'CNBC'
    ].sort(() => Math.random() - 0.5).slice(0, 3);
    
    // Generate top keywords
    const topKeywords = generateKeyPhrases(asset, sentimentAverage > 0).slice(0, 5);
    
    return {
      asset,
      totalMentions,
      mentionsChange24h: mentionsChange,
      sentimentAverage,
      sentimentChange24h: Math.random() * 20 - 10,
      topSources,
      topKeywords,
      viralityScore,
      timestamp: Date.now()
    };
  });
}

/**
 * Generates relevant key phrases for an asset
 */
function generateKeyPhrases(asset: string, positive: boolean): string[] {
  const positiveKeyPhrases: { [key: string]: string[] } = {
    'BTC': [
      'bitcoin bullish', 'btc breakout', 'bitcoin adoption', 'institutional buying',
      'bitcoin etf approval', 'btc halving', 'crypto regulations positive', 'digital gold'
    ],
    'ETH': [
      'ethereum scaling', 'eth staking', 'eth2 upgrade', 'defi growth',
      'eth burning', 'ethereum adoption', 'layer 2 success', 'smart contract leader'
    ],
    'SOL': [
      'solana speed', 'sol ecosystem', 'solana nft boom', 'sol validator growth',
      'solana partnerships', 'fast transactions', 'sol breakout', 'solana defi'
    ],
    'BNB': [
      'binance growth', 'bnb burn', 'binance chain', 'bnb staking',
      'binance smart chain', 'bnb utility', 'exchange token', 'binance expansion'
    ]
  };
  
  const negativeKeyPhrases: { [key: string]: string[] } = {
    'BTC': [
      'bitcoin bearish', 'btc crash', 'crypto regulation', 'btc mining ban',
      'bitcoin bubble', 'crypto ban', 'bitcoin energy concerns', 'btc manipulation'
    ],
    'ETH': [
      'ethereum gas fees', 'eth competitors', 'eth merge delay', 'ethereum centralization',
      'eth security concerns', 'vitalik selling', 'ethereum scaling issues', 'eth fork'
    ],
    'SOL': [
      'solana outage', 'sol downtime', 'solana centralization', 'sol validator issues',
      'solana hack', 'sol competition', 'solana congestion', 'sol token unlocks'
    ],
    'BNB': [
      'binance investigation', 'bnb sec', 'binance regulatory', 'centralized concerns',
      'binance hack', 'exchange risk', 'binance ban', 'bnb competition'
    ]
  };
  
  // Default phrases if the asset is not in the predefined lists
  const defaultPositive = [
    'bullish momentum', 'price increase', 'technical breakout', 'strong fundamentals',
    'new partnerships', 'growing adoption', 'oversold bounce', 'accumulation phase'
  ];
  
  const defaultNegative = [
    'bearish trend', 'price drop', 'sell pressure', 'technical breakdown',
    'project concerns', 'competitor advantage', 'token dilution', 'weak volume'
  ];
  
  // Select the appropriate set of phrases
  const phrases = positive ?
    (positiveKeyPhrases[asset] || defaultPositive) :
    (negativeKeyPhrases[asset] || defaultNegative);
  
  // Randomly select a subset of phrases
  return phrases
    .sort(() => Math.random() - 0.5)
    .slice(0, 3 + Math.floor(Math.random() * 3)); // 3-5 phrases
}

/**
 * Returns a weight factor for different sentiment sources
 */
function getSourceWeight(source: string): number {
  switch (source) {
    case 'twitter':
      return 0.8; // High influence but noisy
    case 'reddit':
      return 0.7; // Community sentiment
    case 'news':
      return 1.0; // Highest weight for news
    case 'telegram':
      return 0.6; // Insider groups but can be manipulated
    case 'discord':
      return 0.7; // Community engagement
    case 'youtube':
      return 0.9; // Influencer impact
    default:
      return 0.5;
  }
}

/**
 * Calculates overall market sentiment
 */
function calculateMarketSentiment(
  assetSentiments: {
    [symbol: string]: {
      overallSentiment: number;
      sentimentBySource: { [source: string]: number };
      volumeBySource: { [source: string]: number };
      keyPhrases: string[];
      mediaAttention: number;
      confidence: number;
    };
  },
  assets: string[]
) {
  // Overall market sentiment (weighted average of all assets)
  let overallSentiment = 0;
  let totalWeight = 0;
  
  // Define asset categories and their weights in the market
  const assetCategories: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'altcoins',
    'SOL': 'altcoins',
    'AVAX': 'altcoins',
    'DOT': 'altcoins',
    'ADA': 'altcoins',
    'UNI': 'defi',
    'AAVE': 'defi',
    'MKR': 'defi',
    'COMP': 'defi',
    'USDT': 'stablecoins',
    'USDC': 'stablecoins',
    'DAI': 'stablecoins',
    'BAYC': 'nfts',
    'PUNK': 'nfts',
  };
  
  // Calculate sentiment by category
  const categorySentiments: { [category: string]: { sum: number; count: number } } = {
    bitcoin: { sum: 0, count: 0 },
    ethereum: { sum: 0, count: 0 },
    altcoins: { sum: 0, count: 0 },
    defi: { sum: 0, count: 0 },
    nfts: { sum: 0, count: 0 },
    stablecoins: { sum: 0, count: 0 }
  };
  
  // Calculate overall and category sentiments
  assets.forEach(asset => {
    if (assetSentiments[asset]) {
      const sentiment = assetSentiments[asset].overallSentiment;
      let weight = 1;
      
      // Give more weight to assets with higher media attention
      weight *= (1 + assetSentiments[asset].mediaAttention / 100);
      
      // Give more weight to BTC and ETH
      if (asset === 'BTC') weight *= 3;
      if (asset === 'ETH') weight *= 2;
      
      overallSentiment += sentiment * weight;
      totalWeight += weight;
      
      // Add to category sentiment
      const category = assetCategories[asset] || 'altcoins';
      categorySentiments[category].sum += sentiment;
      categorySentiments[category].count++;
    }
  });
  
  // Calculate average sentiment by category
  const byCategory: { [category: string]: number } = {};
  Object.keys(categorySentiments).forEach(category => {
    const { sum, count } = categorySentiments[category];
    byCategory[category] = count > 0 ? sum / count : 0;
  });
  
  return {
    overall: totalWeight > 0 ? overallSentiment / totalWeight : 0,
    byCategory
  };
}

/**
 * Identifies trending topics and virality alerts
 */
function identifyTrendingTopics(
  sentimentData: SentimentData[],
  mediaCoverage: MediaCoverage[]
): {
  trendingTopics: string[];
  viralityAlerts: {
    topic: string;
    viralityScore: number;
    sentiment: number;
    potentialImpact: 'low' | 'medium' | 'high' | 'extreme';
  }[];
} {
  // Extract all key phrases from sentiment data
  const allPhrases: { phrase: string; count: number; sentiment: number; }[] = [];
  
  // Count phrase occurrences and average sentiment
  sentimentData.forEach(data => {
    data.keyPhrases.forEach(phrase => {
      const existingIndex = allPhrases.findIndex(p => p.phrase === phrase);
      if (existingIndex >= 0) {
        allPhrases[existingIndex].count++;
        allPhrases[existingIndex].sentiment = 
          (allPhrases[existingIndex].sentiment + data.sentiment) / 2;
      } else {
        allPhrases.push({
          phrase,
          count: 1,
          sentiment: data.sentiment
        });
      }
    });
  });
  
  // Add phrases from media coverage
  mediaCoverage.forEach(coverage => {
    coverage.topKeywords.forEach(keyword => {
      const existingIndex = allPhrases.findIndex(p => p.phrase === keyword);
      if (existingIndex >= 0) {
        allPhrases[existingIndex].count += 2; // Media coverage counts more
        allPhrases[existingIndex].sentiment = 
          (allPhrases[existingIndex].sentiment + coverage.sentimentAverage) / 2;
      } else {
        allPhrases.push({
          phrase: keyword,
          count: 2,
          sentiment: coverage.sentimentAverage
        });
      }
    });
  });
  
  // Sort by count to find trending topics
  const sortedByCount = [...allPhrases].sort((a, b) => b.count - a.count);
  const trendingTopics = sortedByCount.slice(0, 10).map(p => p.phrase);
  
  // Identify virality alerts (high count + extreme sentiment)
  const viralityThreshold = Math.max(3, sortedByCount[0].count * 0.5); // Dynamic threshold
  
  const viralityAlerts = sortedByCount
    .filter(p => p.count >= viralityThreshold && Math.abs(p.sentiment) > 30)
    .map(p => {
      // Calculate potential impact based on count and sentiment extremity
      const countFactor = p.count / sortedByCount[0].count; // Relative to highest count
      const sentimentFactor = Math.abs(p.sentiment) / 100;
      const impactScore = countFactor * 0.6 + sentimentFactor * 0.4;
      
      let potentialImpact: 'low' | 'medium' | 'high' | 'extreme';
      if (impactScore > 0.8) potentialImpact = 'extreme';
      else if (impactScore > 0.6) potentialImpact = 'high';
      else if (impactScore > 0.4) potentialImpact = 'medium';
      else potentialImpact = 'low';
      
      return {
        topic: p.phrase,
        viralityScore: Math.round(impactScore * 100),
        sentiment: p.sentiment,
        potentialImpact
      };
    });
  
  return { trendingTopics, viralityAlerts };
}

/**
 * Maps impact string to numeric value
 */
function mapImpactToNumber(impact: 'low' | 'medium' | 'high' | 'extreme'): number {
  switch (impact) {
    case 'extreme': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
    default: return 0;
  }
}

/**
 * Generates trading recommendations based on sentiment analysis
 */
function generateSentimentRecommendations(
  analysis: SentimentAnalysisResult,
  assets: string[]
): string[] {
  const recommendations: string[] = [];
  
  // Overall market sentiment recommendations
  if (analysis.marketSentiment.overall > 60) {
    recommendations.push('Market sentiment is highly positive. Consider increasing exposure to high-beta assets.');
  } else if (analysis.marketSentiment.overall > 30) {
    recommendations.push('Market sentiment is moderately positive. Maintain balanced exposure with slight bullish bias.');
  } else if (analysis.marketSentiment.overall < -60) {
    recommendations.push('Market sentiment is extremely negative. Consider reducing exposure or hedging positions.');
  } else if (analysis.marketSentiment.overall < -30) {
    recommendations.push('Market sentiment is moderately negative. Exercise caution with new positions.');
  }
  
  // Asset-specific recommendations
  const sortedAssets = assets
    .filter(asset => analysis.assets[asset]) // Only assets with data
    .sort((a, b) => {
      const sentimentA = analysis.assets[a].overallSentiment;
      const sentimentB = analysis.assets[b].overallSentiment;
      return sentimentB - sentimentA; // Sort by sentiment, highest first
    });
  
  // Most positive asset
  if (sortedAssets.length > 0) {
    const mostPositive = sortedAssets[0];
    const sentiment = analysis.assets[mostPositive].overallSentiment;
    const confidence = analysis.assets[mostPositive].confidence;
    
    if (sentiment > 50 && confidence > 60) {
      recommendations.push(`${mostPositive} has the most positive sentiment with high confidence. Consider increasing allocation.`);
    } else if (sentiment > 30) {
      recommendations.push(`${mostPositive} has positive sentiment. Monitor for entry opportunities.`);
    }
  }
  
  // Most negative asset
  if (sortedAssets.length > 1) {
    const mostNegative = sortedAssets[sortedAssets.length - 1];
    const sentiment = analysis.assets[mostNegative].overallSentiment;
    const confidence = analysis.assets[mostNegative].confidence;
    
    if (sentiment < -50 && confidence > 60) {
      recommendations.push(`${mostNegative} has the most negative sentiment with high confidence. Consider reducing exposure.`);
    } else if (sentiment < -30) {
      recommendations.push(`${mostNegative} has negative sentiment. Monitor for potential further downside.`);
    }
  }
  
  // Virality alerts recommendations
  if (analysis.viralityAlerts.length > 0) {
    const highImpactAlerts = analysis.viralityAlerts
      .filter(alert => alert.potentialImpact === 'high' || alert.potentialImpact === 'extreme');
    
    if (highImpactAlerts.length > 0) {
      const alertTopics = highImpactAlerts.map(a => a.topic).join(', ');
      recommendations.push(`High-impact viral topics detected: ${alertTopics}. Monitor closely for potential market moves.`);
    }
  }
  
  // If no specific recommendations, add a general one
  if (recommendations.length === 0) {
    recommendations.push('No strong sentiment signals detected. Maintain current strategy and monitor for developing trends.');
  }
  
  return recommendations;
}
