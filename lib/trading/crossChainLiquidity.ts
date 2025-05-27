/**
 * Cross-Chain Liquidity Analysis Module
 * 
 * This module tracks liquidity movements between different blockchains (ETH, SOL, BSC, etc.)
 * to identify potential early signals for price movements in the crypto market.
 */

export interface ChainLiquidity {
  chain: string;
  totalLiquidity: number; // In USD
  liquidityChange24h: number; // In USD
  liquidityChange24hPercent: number; // In percent
  netInflow: number; // Positive = inflow, negative = outflow
  topPairs: {
    pair: string;
    liquidity: number;
    change24h: number;
  }[];
}

export interface CrossChainFlow {
  sourceChain: string;
  destinationChain: string;
  volume24h: number;
  change24h: number; // Percent change from previous 24h
  dominantAsset: string;
  timestamp: number;
}

export interface LiquidityAnalysis {
  chains: ChainLiquidity[];
  flows: CrossChainFlow[];
  timestamp: number;
  dominantFlowDirection: string; // e.g., "ETH->SOL"
  totalCrossChainVolume24h: number;
  topGrowingChains: string[];
  topShrinkingChains: string[];
}

/**
 * Analyzes liquidity across different blockchains
 * @returns Comprehensive cross-chain liquidity analysis
 */
export async function analyzeCrossChainLiquidity(): Promise<LiquidityAnalysis> {
  console.log('Analyzing cross-chain liquidity flows');
  
  // In a real implementation, this would connect to various blockchain APIs,
  // bridge monitoring services, and DEX aggregators
  
  // Simulated data for the trading bot
  const chainData: ChainLiquidity[] = [
    {
      chain: 'Ethereum',
      totalLiquidity: 42000000000,
      liquidityChange24h: -850000000,
      liquidityChange24hPercent: -2.1,
      netInflow: -850000000,
      topPairs: [
        { pair: 'ETH/USDT', liquidity: 3200000000, change24h: -3.2 },
        { pair: 'ETH/USDC', liquidity: 2800000000, change24h: -2.8 },
        { pair: 'WBTC/ETH', liquidity: 1900000000, change24h: -1.5 },
      ],
    },
    {
      chain: 'Solana',
      totalLiquidity: 6800000000,
      liquidityChange24h: 420000000,
      liquidityChange24hPercent: 6.5,
      netInflow: 420000000,
      topPairs: [
        { pair: 'SOL/USDC', liquidity: 980000000, change24h: 8.2 },
        { pair: 'SOL/USDT', liquidity: 760000000, change24h: 7.4 },
        { pair: 'JitoSOL/USDC', liquidity: 340000000, change24h: 12.5 },
      ],
    },
    {
      chain: 'BSC',
      totalLiquidity: 9200000000,
      liquidityChange24h: -310000000,
      liquidityChange24hPercent: -3.2,
      netInflow: -310000000,
      topPairs: [
        { pair: 'BNB/USDT', liquidity: 1200000000, change24h: -2.8 },
        { pair: 'BNB/BUSD', liquidity: 980000000, change24h: -4.1 },
        { pair: 'CAKE/BNB', liquidity: 420000000, change24h: -5.2 },
      ],
    },
    {
      chain: 'Arbitrum',
      totalLiquidity: 3900000000,
      liquidityChange24h: 280000000,
      liquidityChange24hPercent: 7.7,
      netInflow: 280000000,
      topPairs: [
        { pair: 'ETH/USDC', liquidity: 820000000, change24h: 6.8 },
        { pair: 'ARB/USDC', liquidity: 410000000, change24h: 12.4 },
        { pair: 'GMX/ETH', liquidity: 290000000, change24h: 9.2 },
      ],
    },
  ];
  
  const flowData: CrossChainFlow[] = [
    {
      sourceChain: 'Ethereum',
      destinationChain: 'Solana',
      volume24h: 380000000,
      change24h: 32.5,
      dominantAsset: 'USDC',
      timestamp: Date.now() - 3600000,
    },
    {
      sourceChain: 'Ethereum',
      destinationChain: 'Arbitrum',
      volume24h: 320000000,
      change24h: 28.2,
      dominantAsset: 'ETH',
      timestamp: Date.now() - 4800000,
    },
    {
      sourceChain: 'BSC',
      destinationChain: 'Solana',
      volume24h: 210000000,
      change24h: 18.9,
      dominantAsset: 'USDT',
      timestamp: Date.now() - 7200000,
    },
    {
      sourceChain: 'Ethereum',
      destinationChain: 'BSC',
      volume24h: 180000000,
      change24h: -8.3,
      dominantAsset: 'USDT',
      timestamp: Date.now() - 9000000,
    },
  ];
  
  // Determine dominant flow direction
  const dominantFlow = flowData.reduce((max, flow) => 
    flow.volume24h > max.volume24h ? flow : max, flowData[0]);
  
  const dominantFlowDirection = `${dominantFlow.sourceChain}->${dominantFlow.destinationChain}`;
  
  // Calculate total cross-chain volume
  const totalCrossChainVolume24h = flowData.reduce((sum, flow) => sum + flow.volume24h, 0);
  
  // Identify top growing and shrinking chains
  const sortedByGrowth = [...chainData].sort((a, b) => 
    b.liquidityChange24hPercent - a.liquidityChange24hPercent);
  
  const topGrowingChains = sortedByGrowth
    .filter(chain => chain.liquidityChange24hPercent > 0)
    .map(chain => chain.chain);
  
  const topShrinkingChains = sortedByGrowth
    .filter(chain => chain.liquidityChange24hPercent < 0)
    .map(chain => chain.chain)
    .reverse(); // Most shrinking first
  
  return {
    chains: chainData,
    flows: flowData,
    timestamp: Date.now(),
    dominantFlowDirection,
    totalCrossChainVolume24h,
    topGrowingChains,
    topShrinkingChains,
  };
}

/**
 * Generate cross-chain liquidity signal for trading decisions
 * @returns Signal value and affected assets
 */
export async function getCrossChainLiquiditySignal(): Promise<{
  signal: number; // -100 to 100
  confidence: number; // 0 to 100
  targetAssets: { asset: string; direction: 'buy' | 'sell' | 'neutral'; strength: number }[];
  affectedChains: { chain: string; trend: 'growing' | 'shrinking' }[];
}> {
  try {
    const analysis = await analyzeCrossChainLiquidity();
    
    // Calculate signal based on liquidity flows
    let signalValue = 0;
    
    // Factor 1: Direction of dominant flows
    // Flows to L2s and alt-L1s are often bullish for those ecosystems
    const growingChains = new Set(analysis.topGrowingChains);
    const shrinkingChains = new Set(analysis.topShrinkingChains);
    
    // Evaluate flows impact
    for (const flow of analysis.flows) {
      const sourceIsShrinking = shrinkingChains.has(flow.sourceChain);
      const destIsGrowing = growingChains.has(flow.destinationChain);
      
      // Flows from shrinking to growing chains are strongest signals
      if (sourceIsShrinking && destIsGrowing) {
        signalValue += (flow.volume24h / analysis.totalCrossChainVolume24h) * 80;
      }
      // Flows to growing chains are positive signals
      else if (destIsGrowing) {
        signalValue += (flow.volume24h / analysis.totalCrossChainVolume24h) * 40;
      }
      // Flows from shrinking chains are negative signals for source
      else if (sourceIsShrinking) {
        signalValue -= (flow.volume24h / analysis.totalCrossChainVolume24h) * 30;
      }
    }
    
    // Factor 2: Growth rates of chains
    let chainFactor = 0;
    for (const chain of analysis.chains) {
      chainFactor += chain.liquidityChange24hPercent * (chain.totalLiquidity / 1e10); // Normalize by size
    }
    chainFactor = Math.max(-50, Math.min(50, chainFactor)); // Cap at +/- 50
    
    // Combine factors
    signalValue = signalValue * 0.7 + chainFactor * 0.3;
    signalValue = Math.max(-100, Math.min(100, signalValue)); // Normalize to -100 to 100
    
    // Confidence based on total volume and data recency
    const volumeConfidence = Math.min(70, analysis.totalCrossChainVolume24h / 1e9 * 10);
    const recencyConfidence = 30; // Fixed for mock data; would be based on data freshness
    const confidence = volumeConfidence + recencyConfidence;
    
    // Identify affected assets and chains
    const targetAssets: { asset: string; direction: 'buy' | 'sell' | 'neutral'; strength: number }[] = [];
    const affectedChains: { chain: string; trend: 'growing' | 'shrinking' }[] = [];
    
    // Map chains to their native assets
    const chainToAsset: {[key: string]: string} = {
      'Ethereum': 'ETH',
      'Solana': 'SOL',
      'BSC': 'BNB',
      'Arbitrum': 'ARB',
      'Optimism': 'OP',
      'Avalanche': 'AVAX',
    };
    
    // Add growing chains' assets as buy signals
    for (const chain of analysis.topGrowingChains) {
      const asset = chainToAsset[chain] || chain;
      const strength = analysis.chains.find(c => c.chain === chain)?.liquidityChange24hPercent || 0;
      targetAssets.push({
        asset,
        direction: 'buy',
        strength: Math.min(100, Math.abs(strength) * 2)
      });
      
      affectedChains.push({
        chain,
        trend: 'growing'
      });
    }
    
    // Add shrinking chains' assets as sell signals
    for (const chain of analysis.topShrinkingChains) {
      const asset = chainToAsset[chain] || chain;
      const strength = analysis.chains.find(c => c.chain === chain)?.liquidityChange24hPercent || 0;
      targetAssets.push({
        asset,
        direction: 'sell',
        strength: Math.min(100, Math.abs(strength) * 2)
      });
      
      affectedChains.push({
        chain,
        trend: 'shrinking'
      });
    }
    
    // Add dominant assets in major flows
    const uniqueDominantAssets = new Set(analysis.flows.map(f => f.dominantAsset));
    for (const asset of uniqueDominantAssets) {
      const relevantFlows = analysis.flows.filter(f => f.dominantAsset === asset);
      const netFlow = relevantFlows.reduce((net, flow) => {
        // Positive if destination is growing, negative if source is shrinking
        const flowValue = flow.volume24h * (
          growingChains.has(flow.destinationChain) ? 1 : 
          shrinkingChains.has(flow.sourceChain) ? -1 : 0
        );
        return net + flowValue;
      }, 0);
      
      if (Math.abs(netFlow) > 50000000) { // Only significant flows
        targetAssets.push({
          asset,
          direction: netFlow > 0 ? 'buy' : 'sell',
          strength: Math.min(100, Math.abs(netFlow) / 1e6)
        });
      }
    }
    
    return {
      signal: signalValue,
      confidence,
      targetAssets,
      affectedChains
    };
  } catch (error) {
    console.error('Error in cross-chain liquidity signal generation:', error);
    return {
      signal: 0,
      confidence: 0,
      targetAssets: [],
      affectedChains: []
    };
  }
}
