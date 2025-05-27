'use server';

import axios from 'axios';

type WhaleTransaction = {
  timestamp: number;
  blockchain: string;
  asset: string;
  amount: number;
  amountUsd: number;
  fromAddress: string;
  toAddress: string;
  transactionType: 'transfer' | 'exchange_deposit' | 'exchange_withdrawal' | 'mint' | 'burn' | 'unknown';
  exchangeData?: {
    name: string;
    direction: 'inflow' | 'outflow';
  };
};

type WhaleAlert = {
  timestamp: number;
  symbol: string;
  timeframe: '1h' | '6h' | '24h' | '7d';
  totalTransactions: number;
  totalVolumeUsd: number;
  netExchangeFlow: number; // Positive = net inflow, negative = net outflow
  largestTransaction: WhaleTransaction;
  recentTransactions: WhaleTransaction[];
  unusualActivity: boolean;
  alert: string;
  significance: number; // 0-100
  sentiment: 'bullish' | 'bearish' | 'neutral';
};

type WhaleSignal = {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  alert: string;
  transactions: WhaleTransaction[];
};

// Addresses known to be exchanges, treasuries, or other important entities
const KNOWN_ADDRESSES: Record<string, { name: string; type: 'exchange' | 'treasury' | 'project' | 'fund' }> = {
  // These would be real addresses in production
  '0xExampleBinance1': { name: 'Binance', type: 'exchange' },
  '0xExampleBinance2': { name: 'Binance', type: 'exchange' },
  '0xExampleCoinbase1': { name: 'Coinbase', type: 'exchange' },
  '0xExampleKraken1': { name: 'Kraken', type: 'exchange' },
  '0xExampleGrayscale1': { name: 'Grayscale', type: 'fund' },
  '0xExampleMicroStrategy': { name: 'MicroStrategy', type: 'treasury' },
  '0xExampleTether': { name: 'Tether Treasury', type: 'project' },
};

// Get whale transactions for a given symbol and timeframe
export async function getWhaleTransactions(symbol: string, timeframe: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<WhaleTransaction[]> {
  console.log(`Getting whale transactions for ${symbol} over ${timeframe} timeframe`);
  
  try {
    // In a real implementation, this would call a whale alert API or blockchain indexer
    // For this example, we'll generate realistic mock data
    
    // Determine the number of transactions to generate based on timeframe
    const transactionCount = timeframe === '1h' ? 2 + Math.floor(Math.random() * 3) :
                            timeframe === '6h' ? 5 + Math.floor(Math.random() * 5) :
                            timeframe === '24h' ? 10 + Math.floor(Math.random() * 10) :
                            20 + Math.floor(Math.random() * 20);
    
    // Current time minus the timeframe duration in milliseconds
    const startTime = Date.now() - (timeframe === '1h' ? 3600000 :
                                   timeframe === '6h' ? 21600000 :
                                   timeframe === '24h' ? 86400000 : 604800000);
    
    // Define possible known addresses for this symbol
    const exchanges = Object.entries(KNOWN_ADDRESSES).filter(([_, data]) => data.type === 'exchange');
    
    // Generate transactions
    const transactions: WhaleTransaction[] = [];
    
    for (let i = 0; i < transactionCount; i++) {
      // Determine if this is an exchange transaction
      const isExchangeTransaction = Math.random() < 0.7; // 70% chance of exchange transaction
      
      // Select random exchange if this is an exchange transaction
      let exchangeData: { name: string; direction: 'inflow' | 'outflow' } | undefined;
      let fromAddress = `0x${Math.random().toString(16).substring(2, 10)}`; // Random address
      let toAddress = `0x${Math.random().toString(16).substring(2, 10)}`; // Random address
      let transactionType: WhaleTransaction['transactionType'] = 'transfer';
      
      if (isExchangeTransaction && exchanges.length > 0) {
        const exchangeIndex = Math.floor(Math.random() * exchanges.length);
        const exchangeAddress = exchanges[exchangeIndex][0];
        const exchangeName = exchanges[exchangeIndex][1].name;
        
        const isInflow = Math.random() < 0.5; // 50% chance of inflow vs outflow
        
        if (isInflow) {
          // Funds going to exchange
          toAddress = exchangeAddress;
          exchangeData = { name: exchangeName, direction: 'inflow' };
          transactionType = 'exchange_deposit';
        } else {
          // Funds leaving exchange
          fromAddress = exchangeAddress;
          exchangeData = { name: exchangeName, direction: 'outflow' };
          transactionType = 'exchange_withdrawal';
        }
      }
      
      // Determine transaction amount
      // Use symbol to adjust for realistic amounts (e.g., BTC vs ETH vs SOL)
      let baseAmount: number;
      if (symbol.includes('BTC')) {
        baseAmount = 5 + Math.random() * 95; // 5-100 BTC
      } else if (symbol.includes('ETH')) {
        baseAmount = 50 + Math.random() * 950; // 50-1000 ETH
      } else if (symbol.includes('SOL')) {
        baseAmount = 1000 + Math.random() * 9000; // 1000-10000 SOL
      } else {
        baseAmount = 10000 + Math.random() * 90000; // 10k-100k for other tokens
      }
      
      // Calculate USD value
      const usdPrice = symbol.includes('BTC') ? 30000 + Math.random() * 10000 :
                      symbol.includes('ETH') ? 1500 + Math.random() * 500 :
                      symbol.includes('SOL') ? 20 + Math.random() * 30 : 1;
      
      const amountUsd = baseAmount * usdPrice;
      
      // Create transaction
      transactions.push({
        timestamp: startTime + Math.floor(Math.random() * (Date.now() - startTime)),
        blockchain: symbol.includes('BTC') ? 'Bitcoin' : 'Ethereum',
        asset: symbol.replace('USDT', ''),
        amount: baseAmount,
        amountUsd,
        fromAddress,
        toAddress,
        transactionType,
        exchangeData
      });
    }
    
    // Sort by timestamp, most recent first
    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching whale transactions:', error);
    return [];
  }
}

// Analyze whale transactions and generate alerts
export async function analyzeWhaleActivity(symbol: string, timeframe: '1h' | '6h' | '24h' | '7d' = '24h'): Promise<WhaleAlert> {
  console.log(`Analyzing whale activity for ${symbol} over ${timeframe} timeframe`);
  
  try {
    // Get whale transactions
    const transactions = await getWhaleTransactions(symbol, timeframe);
    
    // Calculate metrics
    const totalVolumeUsd = transactions.reduce((sum, tx) => sum + tx.amountUsd, 0);
    
    // Calculate exchange flows
    let exchangeInflow = 0;
    let exchangeOutflow = 0;
    
    transactions.forEach(tx => {
      if (tx.exchangeData) {
        if (tx.exchangeData.direction === 'inflow') {
          exchangeInflow += tx.amountUsd;
        } else {
          exchangeOutflow += tx.amountUsd;
        }
      }
    });
    
    const netExchangeFlow = exchangeInflow - exchangeOutflow;
    
    // Find largest transaction
    const largestTransaction = transactions.reduce((largest, tx) => 
      tx.amountUsd > largest.amountUsd ? tx : largest, transactions[0] || {
        timestamp: Date.now(),
        blockchain: '',
        asset: '',
        amount: 0,
        amountUsd: 0,
        fromAddress: '',
        toAddress: '',
        transactionType: 'unknown'
      });
    
    // Determine if there is unusual activity
    // In a real implementation, this would compare to historical norms
    const unusualActivity = totalVolumeUsd > 100000000 || Math.abs(netExchangeFlow) > 50000000;
    
    // Generate alert message
    let alert = '';
    let significance = 0;
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (unusualActivity) {
      if (netExchangeFlow < -50000000) {
        alert = `Large net outflow (${Math.abs(netExchangeFlow / 1000000).toFixed(1)}M USD) from exchanges detected. Potential accumulation by whales.`;
        significance = 80;
        sentiment = 'bullish';
      } else if (netExchangeFlow > 50000000) {
        alert = `Large net inflow (${(netExchangeFlow / 1000000).toFixed(1)}M USD) to exchanges detected. Potential distribution by whales.`;
        significance = 80;
        sentiment = 'bearish';
      } else if (totalVolumeUsd > 100000000) {
        alert = `High whale transaction volume (${(totalVolumeUsd / 1000000).toFixed(1)}M USD) detected.`;
        significance = 60;
        sentiment = 'neutral';
      }
    } else if (transactions.length > 0) {
      if (netExchangeFlow < 0) {
        alert = `Net outflow (${Math.abs(netExchangeFlow / 1000000).toFixed(1)}M USD) from exchanges. Mild bullish signal.`;
        significance = 40;
        sentiment = 'bullish';
      } else if (netExchangeFlow > 0) {
        alert = `Net inflow (${(netExchangeFlow / 1000000).toFixed(1)}M USD) to exchanges. Mild bearish signal.`;
        significance = 40;
        sentiment = 'bearish';
      } else {
        alert = `Balanced whale activity with ${transactions.length} transactions totaling ${(totalVolumeUsd / 1000000).toFixed(1)}M USD.`;
        significance = 20;
        sentiment = 'neutral';
      }
    } else {
      alert = 'No significant whale activity detected.';
      significance = 0;
      sentiment = 'neutral';
    }
    
    return {
      timestamp: Date.now(),
      symbol,
      timeframe,
      totalTransactions: transactions.length,
      totalVolumeUsd,
      netExchangeFlow,
      largestTransaction,
      recentTransactions: transactions.slice(0, 5), // Top 5 most recent
      unusualActivity,
      alert,
      significance,
      sentiment
    };
  } catch (error) {
    console.error('Error analyzing whale activity:', error);
    return {
      timestamp: Date.now(),
      symbol,
      timeframe,
      totalTransactions: 0,
      totalVolumeUsd: 0,
      netExchangeFlow: 0,
      largestTransaction: {
        timestamp: Date.now(),
        blockchain: '',
        asset: '',
        amount: 0,
        amountUsd: 0,
        fromAddress: '',
        toAddress: '',
        transactionType: 'unknown'
      },
      recentTransactions: [],
      unusualActivity: false,
      alert: 'Error analyzing whale activity.',
      significance: 0,
      sentiment: 'neutral'
    };
  }
}

// Generate trading signals based on whale activity
export async function getWhaleSignals(symbol: string): Promise<WhaleSignal> {
  try {
    // Analyze whale activity across different timeframes
    const [hourlyData, dailyData] = await Promise.all([
      analyzeWhaleActivity(symbol, '1h'),
      analyzeWhaleActivity(symbol, '24h')
    ]);
    
    let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
    let strength = 0;
    let alert = '';
    
    // Combine signals from different timeframes, with more weight on recent activity
    const hourlySignificance = hourlyData.significance * 0.6; // 60% weight
    const dailySignificance = dailyData.significance * 0.4; // 40% weight
    
    const combinedSignificance = hourlySignificance + dailySignificance;
    
    // Determine hourly signal
    if (hourlyData.sentiment === 'bullish' && hourlyData.significance > 60) {
      signal = 'buy';
      strength = combinedSignificance;
      alert = `Strong buy signal: ${hourlyData.alert} This is supported by ${dailyData.alert.toLowerCase()}`;
    } else if (hourlyData.sentiment === 'bearish' && hourlyData.significance > 60) {
      signal = 'sell';
      strength = combinedSignificance;
      alert = `Strong sell signal: ${hourlyData.alert} This is supported by ${dailyData.alert.toLowerCase()}`;
    } else if (dailyData.sentiment === 'bullish' && dailyData.significance > 70) {
      signal = 'buy';
      strength = combinedSignificance * 0.8; // Slightly less strength for daily-only signals
      alert = `Buy signal based on daily whale activity: ${dailyData.alert}`;
    } else if (dailyData.sentiment === 'bearish' && dailyData.significance > 70) {
      signal = 'sell';
      strength = combinedSignificance * 0.8; // Slightly less strength for daily-only signals
      alert = `Sell signal based on daily whale activity: ${dailyData.alert}`;
    } else {
      // If no strong signals, default to neutral
      signal = 'neutral';
      strength = Math.min(30, combinedSignificance / 2); // Cap neutral signals at 30
      alert = hourlyData.alert || dailyData.alert || 'No significant whale activity detected';
    }
    
    // Combine transactions from both timeframes, removing duplicates
    const allTransactions = [...hourlyData.recentTransactions];
    dailyData.recentTransactions.forEach(tx => {
      if (!allTransactions.some(existingTx => existingTx.timestamp === tx.timestamp)) {
        allTransactions.push(tx);
      }
    });
    
    // Sort by recency
    allTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    return {
      signal,
      strength: Math.min(100, strength), // Cap at 100
      alert,
      transactions: allTransactions
    };
  } catch (error) {
    console.error('Error generating whale signals:', error);
    return {
      signal: 'neutral',
      strength: 0,
      alert: 'Error analyzing whale activity.',
      transactions: []
    };
  }
}