/**
 * High-Frequency Arbitrage Module
 * 
 * This module identifies and exploits price discrepancies between different exchanges
 * and trading pairs in millisecond to second timeframes, focusing on high-probability
 * arbitrage opportunities with minimal risk.
 */

export interface ExchangePrice {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  time: number;
  fees: {
    taker: number; // in percentage
    withdrawal: {
      flat: number;
      percent?: number;
    };
  };
  withdrawalTime: number; // estimated time in milliseconds
  depth: {
    bidDepth: number; // in base currency
    askDepth: number; // in base currency
  };
}

export interface ArbitrageOpportunity {
  type: 'exchange' | 'triangular' | 'cross-chain';
  buyExchange: string;
  sellExchange: string;
  symbol: string;
  buyPrice: number;
  sellPrice: number;
  spread: number; // raw spread in percentage
  netSpread: number; // spread after fees in percentage
  maxSize: number; // maximum size in base currency
  estimatedProfit: number; // in quote currency
  confidence: number; // 0-100
  executionTime: number; // estimated time in milliseconds
  risks: string[];
  timestamp: number;
}

export interface TriangularArbitrageOpportunity {
  exchange: string;
  pairs: [string, string, string];
  path: [string, string, string, string]; // e.g., ["USD", "BTC", "ETH", "USD"]
  rates: [number, number, number];
  profitPercent: number;
  netProfitPercent: number;
  maxSize: number; // in starting currency
  estimatedProfit: number; // in starting currency
  confidence: number; // 0-100
  timestamp: number;
}

/**
 * Scans for cross-exchange arbitrage opportunities
 * @returns List of detected arbitrage opportunities
 */
export async function scanExchangeArbitrage(): Promise<ArbitrageOpportunity[]> {
  console.log('Scanning for cross-exchange arbitrage opportunities');
  
  // In a real implementation, this would fetch real-time prices from multiple exchanges
  // and identify opportunities where price differences exceed fees and transaction costs
  
  // Simulated exchange prices for the trading bot
  const exchangePrices: ExchangePrice[] = [
    {
      exchange: 'Bybit',
      symbol: 'BTCUSDT',
      bid: 61205.5,
      ask: 61220.3,
      time: Date.now(),
      fees: {
        taker: 0.1,
        withdrawal: {
          flat: 0.0005,
        },
      },
      withdrawalTime: 1800000, // 30 minutes
      depth: {
        bidDepth: 15.4,
        askDepth: 12.8,
      },
    },
    {
      exchange: 'Binance',
      symbol: 'BTCUSDT',
      bid: 61245.8,
      ask: 61250.2,
      time: Date.now(),
      fees: {
        taker: 0.1,
        withdrawal: {
          flat: 0.0006,
        },
      },
      withdrawalTime: 2100000, // 35 minutes
      depth: {
        bidDepth: 32.7,
        askDepth: 28.5,
      },
    },
    {
      exchange: 'OKX',
      symbol: 'BTC-USDT',
      bid: 61190.5,
      ask: 61205.8,
      time: Date.now(),
      fees: {
        taker: 0.08,
        withdrawal: {
          flat: 0.0004,
        },
      },
      withdrawalTime: 1500000, // 25 minutes
      depth: {
        bidDepth: 14.2,
        askDepth: 13.1,
      },
    },
    {
      exchange: 'Bybit',
      symbol: 'ETHUSDT',
      bid: 3505.2,
      ask: 3507.5,
      time: Date.now(),
      fees: {
        taker: 0.1,
        withdrawal: {
          flat: 0.003,
        },
      },
      withdrawalTime: 1800000, // 30 minutes
      depth: {
        bidDepth: 182.5,
        askDepth: 165.3,
      },
    },
    {
      exchange: 'Binance',
      symbol: 'ETHUSDT',
      bid: 3511.8,
      ask: 3512.4,
      time: Date.now(),
      fees: {
        taker: 0.1,
        withdrawal: {
          flat: 0.004,
        },
      },
      withdrawalTime: 2100000, // 35 minutes
      depth: {
        bidDepth: 325.8,
        askDepth: 298.2,
      },
    },
  ];
  
  // Find arbitrage opportunities
  const opportunities: ArbitrageOpportunity[] = [];
  
  // Group prices by symbol
  const symbolMap: { [symbol: string]: ExchangePrice[] } = {};
  exchangePrices.forEach(price => {
    const normalizedSymbol = normalizeSymbol(price.symbol);
    if (!symbolMap[normalizedSymbol]) {
      symbolMap[normalizedSymbol] = [];
    }
    symbolMap[normalizedSymbol].push(price);
  });
  
  // For each symbol, check for arbitrage between exchanges
  Object.entries(symbolMap).forEach(([symbol, prices]) => {
    for (let i = 0; i < prices.length; i++) {
      const buyExchange = prices[i];
      
      for (let j = 0; j < prices.length; j++) {
        if (i === j) continue; // Skip same exchange
        
        const sellExchange = prices[j];
        
        // Check if there's an arbitrage opportunity
        if (buyExchange.ask < sellExchange.bid) {
          const spread = (sellExchange.bid / buyExchange.ask - 1) * 100;
          
          // Calculate fees
          const buyFee = buyExchange.ask * (buyExchange.fees.taker / 100);
          const sellFee = sellExchange.bid * (sellExchange.fees.taker / 100);
          const totalFees = buyFee + sellFee;
          
          // Calculate net spread after fees
          const netSpread = ((sellExchange.bid - buyExchange.ask - totalFees) / buyExchange.ask) * 100;
          
          // Only consider profitable opportunities
          if (netSpread > 0) {
            // Determine maximum size based on available depth
            const maxSize = Math.min(buyExchange.depth.askDepth, sellExchange.depth.bidDepth);
            
            // Calculate estimated profit
            const estimatedProfit = maxSize * buyExchange.ask * (netSpread / 100);
            
            // Calculate confidence based on depth and time difference
            const timeDiff = Math.abs(buyExchange.time - sellExchange.time);
            const depthRatio = Math.min(buyExchange.depth.askDepth, sellExchange.depth.bidDepth) / 
                             Math.max(buyExchange.depth.askDepth, sellExchange.depth.bidDepth);
            const confidence = Math.max(0, 100 - (timeDiff / 100) - ((1 - depthRatio) * 50));
            
            // Estimate execution time (in milliseconds)
            const executionTime = 500; // Typical exchange API response time
            
            // Identify potential risks
            const risks = [];
            if (timeDiff > 1000) risks.push('Price latency');
            if (depthRatio < 0.5) risks.push('Liquidity imbalance');
            if (netSpread < 0.2) risks.push('Thin margins');
            
            opportunities.push({
              type: 'exchange',
              buyExchange: buyExchange.exchange,
              sellExchange: sellExchange.exchange,
              symbol: normalizeSymbol(buyExchange.symbol),
              buyPrice: buyExchange.ask,
              sellPrice: sellExchange.bid,
              spread,
              netSpread,
              maxSize,
              estimatedProfit,
              confidence,
              executionTime,
              risks,
              timestamp: Date.now(),
            });
          }
        }
      }
    }
  });
  
  return opportunities.sort((a, b) => b.netSpread - a.netSpread);
}

/**
 * Scans for triangular arbitrage opportunities within a single exchange
 * @param exchange The exchange to scan for opportunities
 * @returns List of detected triangular arbitrage opportunities
 */
export async function scanTriangularArbitrage(exchange: string): Promise<TriangularArbitrageOpportunity[]> {
  console.log(`Scanning for triangular arbitrage opportunities on ${exchange}`);
  
  // In a real implementation, this would analyze multiple trading pairs on a single exchange
  // to find circular trading opportunities (e.g., BTC→ETH→USDT→BTC)
  
  // Simulated triangular arbitrage opportunities for the trading bot
  const triangularOpportunities: TriangularArbitrageOpportunity[] = [
    {
      exchange: 'Bybit',
      pairs: ['BTC/USDT', 'ETH/BTC', 'ETH/USDT'],
      path: ['USDT', 'BTC', 'ETH', 'USDT'],
      rates: [1/61220.3, 0.057432, 3511.8], // 1/BTCUSDT ask, ETHBTC bid, ETHUSDT bid
      profitPercent: 0.18,
      netProfitPercent: 0.09, // After fees
      maxSize: 50000, // USDT
      estimatedProfit: 45, // USDT
      confidence: 85,
      timestamp: Date.now(),
    },
    {
      exchange: 'Binance',
      pairs: ['BTC/USDT', 'SOL/BTC', 'SOL/USDT'],
      path: ['USDT', 'BTC', 'SOL', 'USDT'],
      rates: [1/61250.2, 0.002435, 149.8],
      profitPercent: 0.22,
      netProfitPercent: 0.13,
      maxSize: 100000,
      estimatedProfit: 130,
      confidence: 88,
      timestamp: Date.now(),
    },
    {
      exchange: 'OKX',
      pairs: ['ETH/USDT', 'AVAX/ETH', 'AVAX/USDT'],
      path: ['USDT', 'ETH', 'AVAX', 'USDT'],
      rates: [1/3507.5, 0.045321, 159.2],
      profitPercent: 0.15,
      netProfitPercent: 0.08,
      maxSize: 75000,
      estimatedProfit: 60,
      confidence: 82,
      timestamp: Date.now(),
    },
  ];
  
  // Filter by the requested exchange
  return triangularOpportunities
    .filter(opportunity => opportunity.exchange.toLowerCase() === exchange.toLowerCase())
    .sort((a, b) => b.netProfitPercent - a.netProfitPercent);
}

/**
 * Normalize symbol formats across exchanges
 * @param symbol The symbol to normalize
 */
function normalizeSymbol(symbol: string): string {
  // Convert formats like 'BTC-USDT' to 'BTCUSDT'
  return symbol.replace('-', '').replace('/', '').toUpperCase();
}

/**
 * Get arbitrage signal for trading decisions
 * @returns Signal value and opportunities
 */
export async function getArbitrageSignal(): Promise<{
  exchangeArbitrageSignal: number; // 0 to 100
  triangularArbitrageSignal: number; // 0 to 100
  confidence: number; // 0 to 100
  bestOpportunities: (ArbitrageOpportunity | TriangularArbitrageOpportunity)[];
  totalEstimatedProfit: number;
  recommendedAction: string;
}> {
  try {
    // Scan for arbitrage opportunities
    const exchangeArbitrage = await scanExchangeArbitrage();
    const triangularArbitrage = await scanTriangularArbitrage('Bybit'); // Bybit is our primary exchange
    
    // Calculate signals
    const exchangeArbitrageSignal = calculateExchangeArbitrageSignal(exchangeArbitrage);
    const triangularArbitrageSignal = calculateTriangularArbitrageSignal(triangularArbitrage);
    
    // Combine best opportunities
    const bestExchangeOps = exchangeArbitrage.slice(0, 3);
    const bestTriangularOps = triangularArbitrage.slice(0, 2);
    
    // Calculate total estimated profit
    const totalExchangeProfit = bestExchangeOps.reduce((sum, op) => sum + op.estimatedProfit, 0);
    const totalTriangularProfit = bestTriangularOps.reduce((sum, op) => sum + op.estimatedProfit, 0);
    const totalEstimatedProfit = totalExchangeProfit + totalTriangularProfit;
    
    // Calculate overall confidence
    const confidence = calculateArbitrageConfidence(bestExchangeOps, bestTriangularOps);
    
    // Generate recommended action
    const recommendedAction = generateArbitrageRecommendation(
      exchangeArbitrageSignal,
      triangularArbitrageSignal,
      bestExchangeOps,
      bestTriangularOps
    );
    
    return {
      exchangeArbitrageSignal,
      triangularArbitrageSignal,
      confidence,
      bestOpportunities: [...bestExchangeOps, ...bestTriangularOps],
      totalEstimatedProfit,
      recommendedAction
    };
  } catch (error) {
    console.error('Error in arbitrage signal generation:', error);
    return {
      exchangeArbitrageSignal: 0,
      triangularArbitrageSignal: 0,
      confidence: 0,
      bestOpportunities: [],
      totalEstimatedProfit: 0,
      recommendedAction: 'No viable arbitrage opportunities detected'
    };
  }
}

/**
 * Calculate signal strength for exchange arbitrage
 */
function calculateExchangeArbitrageSignal(opportunities: ArbitrageOpportunity[]): number {
  if (opportunities.length === 0) return 0;
  
  // Consider top 3 opportunities
  const topOpportunities = opportunities.slice(0, 3);
  
  // Calculate average net spread and confidence
  const avgNetSpread = topOpportunities.reduce((sum, op) => sum + op.netSpread, 0) / topOpportunities.length;
  const avgConfidence = topOpportunities.reduce((sum, op) => sum + op.confidence, 0) / topOpportunities.length;
  
  // Calculate risk factor (0-1, where 0 is highest risk)
  const riskFactor = 1 - (topOpportunities.reduce((sum, op) => sum + op.risks.length, 0) / 
                         (topOpportunities.length * 3)); // Normalize by max possible risks
  
  // Calculate signal (0-100)
  const signal = (avgNetSpread * 10) * (avgConfidence / 100) * riskFactor;
  
  return Math.min(100, Math.max(0, signal));
}

/**
 * Calculate signal strength for triangular arbitrage
 */
function calculateTriangularArbitrageSignal(opportunities: TriangularArbitrageOpportunity[]): number {
  if (opportunities.length === 0) return 0;
  
  // Consider top 2 opportunities
  const topOpportunities = opportunities.slice(0, 2);
  
  // Calculate average net profit percent and confidence
  const avgNetProfit = topOpportunities.reduce((sum, op) => sum + op.netProfitPercent, 0) / topOpportunities.length;
  const avgConfidence = topOpportunities.reduce((sum, op) => sum + op.confidence, 0) / topOpportunities.length;
  
  // Calculate signal (0-100)
  const signal = (avgNetProfit * 50) * (avgConfidence / 100);
  
  return Math.min(100, Math.max(0, signal));
}

/**
 * Calculate overall confidence in arbitrage signals
 */
function calculateArbitrageConfidence(
  exchangeOps: ArbitrageOpportunity[],
  triangularOps: TriangularArbitrageOpportunity[]
): number {
  if (exchangeOps.length === 0 && triangularOps.length === 0) return 0;
  
  let totalConfidence = 0;
  let count = 0;
  
  // Add exchange arbitrage confidence
  if (exchangeOps.length > 0) {
    totalConfidence += exchangeOps.reduce((sum, op) => sum + op.confidence, 0) / exchangeOps.length;
    count++;
  }
  
  // Add triangular arbitrage confidence
  if (triangularOps.length > 0) {
    totalConfidence += triangularOps.reduce((sum, op) => sum + op.confidence, 0) / triangularOps.length;
    count++;
  }
  
  return totalConfidence / count;
}

/**
 * Generate recommended action based on arbitrage opportunities
 */
function generateArbitrageRecommendation(
  exchangeSignal: number,
  triangularSignal: number,
  exchangeOps: ArbitrageOpportunity[],
  triangularOps: TriangularArbitrageOpportunity[]
): string {
  if (exchangeOps.length === 0 && triangularOps.length === 0) {
    return 'No viable arbitrage opportunities detected';
  }
  
  // Determine the best type of arbitrage
  if (exchangeSignal > triangularSignal && exchangeOps.length > 0) {
    const bestOp = exchangeOps[0];
    return `Execute exchange arbitrage: Buy ${bestOp.symbol} on ${bestOp.buyExchange} at ${bestOp.buyPrice} and sell on ${bestOp.sellExchange} at ${bestOp.sellPrice} for ${bestOp.netSpread.toFixed(2)}% profit`;
  } else if (triangularOps.length > 0) {
    const bestOp = triangularOps[0];
    return `Execute triangular arbitrage on ${bestOp.exchange}: Trade ${bestOp.path.join('->')} for ${bestOp.netProfitPercent.toFixed(2)}% profit`;
  } else {
    return 'Monitor for emerging arbitrage opportunities';
  }
}
