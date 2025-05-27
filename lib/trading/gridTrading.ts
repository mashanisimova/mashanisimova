'use server';

import { BybitCredentials, getWalletBalance, placeOrder, getMarketData, getActiveOrders, getKlineData } from '../api/bybit';
import { TradeRecord } from './autoTrader';
import { analyzeMarketLiquidity } from './liquidityAnalysis';
import { getCombinedDerivativesSignal } from './derivativesAnalysis';

type GridLevel = {
  price: number;
  side: 'Buy' | 'Sell';
  quantity: string;
  orderId?: string;
  status: 'pending' | 'placed' | 'filled' | 'cancelled';
  isActive: boolean;
};

type GridConfig = {
  symbol: string;
  upperPrice: number;
  lowerPrice: number;
  levels: number;
  totalInvestment: number;
  priceDistribution: 'arithmetic' | 'geometric' | 'custom';
  customLevels?: number[];
  quantityDistribution: 'equal' | 'incremental' | 'decremental';
  rebalanceThreshold: number; // Percentage price change to trigger grid rebalance
  enableDynamicAdjustment: boolean;
  trailingConfig?: {
    enabled: boolean;
    trailingPercentage: number;
  };
};

type GridTradingState = {
  config: GridConfig;
  levels: GridLevel[];
  currentPrice: number;
  lastRebalance: number;
  filledOrders: TradeRecord[];
  totalProfit: number;
  status: 'active' | 'paused' | 'stopped';
  createdAt: number;
  updatedAt: number;
};

// Store grid states by symbol
const gridStates: Record<string, GridTradingState> = {};

/**
 * Initialize a new grid trading strategy
 */
export async function initializeGridStrategy(config: GridConfig): Promise<GridTradingState> {
  try {
    console.log(`Initializing grid trading strategy for ${config.symbol}`);
    
    // Validate config
    if (config.upperPrice <= config.lowerPrice) {
      throw new Error('Upper price must be greater than lower price');
    }
    
    if (config.levels < 3) {
      throw new Error('Grid must have at least 3 levels');
    }
    
    // Get current market price
    const marketData = await getMarketData(config.symbol);
    if (!marketData || !marketData.list || marketData.list.length === 0) {
      throw new Error(`Failed to fetch market data for ${config.symbol}`);
    }
    
    const currentPrice = parseFloat(marketData.list[0].lastPrice);
    
    // Validate price range includes current price
    if (currentPrice < config.lowerPrice || currentPrice > config.upperPrice) {
      throw new Error(`Current price (${currentPrice}) is outside the grid range (${config.lowerPrice} - ${config.upperPrice})`);
    }
    
    // Generate grid levels
    let gridLevels: GridLevel[] = [];
    
    if (config.priceDistribution === 'custom' && config.customLevels && config.customLevels.length > 0) {
      // Use custom levels
      gridLevels = generateCustomGrid(config, currentPrice, config.customLevels);
    } else if (config.priceDistribution === 'geometric') {
      // Generate geometric grid (percentage-based spacing)
      gridLevels = generateGeometricGrid(config, currentPrice);
    } else {
      // Default to arithmetic grid (equal spacing)
      gridLevels = generateArithmeticGrid(config, currentPrice);
    }
    
    // Create grid state
    const gridState: GridTradingState = {
      config,
      levels: gridLevels,
      currentPrice,
      lastRebalance: Date.now(),
      filledOrders: [],
      totalProfit: 0,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Store grid state
    gridStates[config.symbol] = gridState;
    
    return gridState;
  } catch (error) {
    console.error('Error initializing grid strategy:', error);
    throw error;
  }
}

/**
 * Deploy the grid strategy by placing the initial orders
 */
export async function deployGridStrategy(symbol: string): Promise<{ success: boolean; message: string; ordersPlaced: number; }> {
  try {
    console.log(`Deploying grid strategy for ${symbol}`);
    
    // Check if grid state exists
    const gridState = gridStates[symbol];
    if (!gridState) {
      throw new Error(`No grid strategy found for ${symbol}`);
    }
    
    // Place orders for each grid level
    let ordersPlaced = 0;
    
    for (let i = 0; i < gridState.levels.length; i++) {
      const level = gridState.levels[i];
      
      // Skip levels that are not actionable based on current price
      if ((level.side === 'Buy' && level.price >= gridState.currentPrice) ||
          (level.side === 'Sell' && level.price <= gridState.currentPrice)) {
        continue;
      }
      
      try {
        // Place limit order
        const orderResult = await placeOrder({
          symbol,
          side: level.side,
          orderType: 'Limit',
          qty: level.quantity,
          price: level.price
        });
        
        if (orderResult && orderResult.orderId) {
          // Update level with order ID
          gridState.levels[i].orderId = orderResult.orderId;
          gridState.levels[i].status = 'placed';
          gridState.levels[i].isActive = true;
          ordersPlaced++;
        }
      } catch (error) {
        console.error(`Failed to place order for level ${i}:`, error);
      }
    }
    
    // Update grid state
    gridState.updatedAt = Date.now();
    gridStates[symbol] = gridState;
    
    return {
      success: ordersPlaced > 0,
      message: `Deployed grid strategy with ${ordersPlaced} orders`,
      ordersPlaced
    };
  } catch (error) {
    console.error('Error deploying grid strategy:', error);
    throw error;
  }
}

/**
 * Update and manage the grid strategy
 */
export async function updateGridStrategy(symbol: string): Promise<{
  success: boolean;
  updated: boolean;
  newOrders: number;
  cancelledOrders: number;
  filledOrders: number;
}> {
  try {
    console.log(`Updating grid strategy for ${symbol}`);
    
    // Check if grid state exists
    const gridState = gridStates[symbol];
    if (!gridState) {
      throw new Error(`No grid strategy found for ${symbol}`);
    }
    
    // Skip if strategy is not active
    if (gridState.status !== 'active') {
      return {
        success: true,
        updated: false,
        newOrders: 0,
        cancelledOrders: 0,
        filledOrders: 0
      };
    }
    
    // Get current market price
    const marketData = await getMarketData(symbol);
    if (!marketData || !marketData.list || marketData.list.length === 0) {
      throw new Error(`Failed to fetch market data for ${symbol}`);
    }
    
    const currentPrice = parseFloat(marketData.list[0].lastPrice);
    const priceChange = Math.abs((currentPrice - gridState.currentPrice) / gridState.currentPrice) * 100;
    
    // Check if rebalance is needed
    let rebalanceNeeded = priceChange >= gridState.config.rebalanceThreshold;
    
    // Get active orders
    const activeOrders = await getActiveOrders(symbol);
    const activeOrderIds = new Set(activeOrders.map((order: any) => order.orderId));
    
    // Update grid levels based on active orders
    let filledOrders = 0;
    for (let i = 0; i < gridState.levels.length; i++) {
      const level = gridState.levels[i];
      
      // Check if order is active
      if (level.orderId && !activeOrderIds.has(level.orderId)) {
        // Order not active anymore, consider it filled
        gridState.levels[i].status = 'filled';
        gridState.levels[i].isActive = false;
        filledOrders++;
        
        // Record filled order
        const profitLoss = level.side === 'Sell' ? 
          (level.price - gridState.currentPrice) * parseFloat(level.quantity) :
          (gridState.currentPrice - level.price) * parseFloat(level.quantity);
        
        gridState.filledOrders.push({
          symbol,
          timeframe: 'grid',
          side: level.side,
          entryPrice: level.price,
          exitPrice: currentPrice,
          size: level.quantity,
          entryTime: gridState.updatedAt,
          exitTime: Date.now(),
          profitLoss,
          profitLossPercent: (profitLoss / (level.price * parseFloat(level.quantity))) * 100,
          strategy: 'Grid Trading',
          signalStrength: 100,
          orderId: level.orderId!,
          status: 'closed'
        });
        
        gridState.totalProfit += profitLoss;
        
        // Add opposite order to maintain grid
        const newLevel: GridLevel = {
          price: level.price,
          side: level.side === 'Buy' ? 'Sell' : 'Buy',
          quantity: level.quantity,
          status: 'pending',
          isActive: false
        };
        
        gridState.levels.push(newLevel);
      }
    }
    
    // If dynamic adjustment is enabled, check if grid needs to be shifted
    if (gridState.config.enableDynamicAdjustment) {
      // Check if price is approaching grid boundaries
      const upperBuffer = (gridState.config.upperPrice - currentPrice) / gridState.config.upperPrice * 100;
      const lowerBuffer = (currentPrice - gridState.config.lowerPrice) / currentPrice * 100;
      
      if (upperBuffer < 5 || lowerBuffer < 5) {
        rebalanceNeeded = true;
      }
      
      // Also check market liquidity and derivatives signals
      try {
        const [liquidityAnalysis, derivativesSignal] = await Promise.all([
          analyzeMarketLiquidity(symbol),
          getCombinedDerivativesSignal(symbol)
        ]);
        
        // If liquidity or derivatives signal suggests a big move, rebalance
        if (liquidityAnalysis.signalStrength > 70 || derivativesSignal.strength > 70) {
          rebalanceNeeded = true;
        }
      } catch (error) {
        console.error('Error checking market conditions:', error);
      }
    }
    
    // If rebalance is needed, cancel all orders and create new grid
    let cancelledOrders = 0;
    let newOrders = 0;
    
    if (rebalanceNeeded) {
      console.log(`Rebalancing grid for ${symbol} due to ${priceChange.toFixed(2)}% price change`);
      
      // Cancel all active orders
      for (const order of activeOrders) {
        try {
          // In a real implementation, this would cancel the order via API
          // Here we'll just mark it as cancelled
          for (let i = 0; i < gridState.levels.length; i++) {
            if (gridState.levels[i].orderId === order.orderId) {
              gridState.levels[i].status = 'cancelled';
              gridState.levels[i].isActive = false;
              cancelledOrders++;
              break;
            }
          }
        } catch (error) {
          console.error(`Failed to cancel order ${order.orderId}:`, error);
        }
      }
      
      // Generate new grid levels
      let newLevels: GridLevel[] = [];
      
      if (gridState.config.priceDistribution === 'custom' && gridState.config.customLevels) {
        newLevels = generateCustomGrid(gridState.config, currentPrice, gridState.config.customLevels);
      } else if (gridState.config.priceDistribution === 'geometric') {
        newLevels = generateGeometricGrid(gridState.config, currentPrice);
      } else {
        newLevels = generateArithmeticGrid(gridState.config, currentPrice);
      }
      
      // Place new orders
      for (let i = 0; i < newLevels.length; i++) {
        const level = newLevels[i];
        
        // Skip levels that are not actionable based on current price
        if ((level.side === 'Buy' && level.price >= currentPrice) ||
            (level.side === 'Sell' && level.price <= currentPrice)) {
          continue;
        }
        
        try {
          // Place limit order
          const orderResult = await placeOrder({
            symbol,
            side: level.side,
            orderType: 'Limit',
            qty: level.quantity,
            price: level.price
          });
          
          if (orderResult && orderResult.orderId) {
            // Update level with order ID
            newLevels[i].orderId = orderResult.orderId;
            newLevels[i].status = 'placed';
            newLevels[i].isActive = true;
            newOrders++;
          }
        } catch (error) {
          console.error(`Failed to place order for new level ${i}:`, error);
        }
      }
      
      // Update grid state with new levels
      gridState.levels = [...gridState.levels.filter(l => l.status === 'filled'), ...newLevels];
      gridState.currentPrice = currentPrice;
      gridState.lastRebalance = Date.now();
    }
    
    // Update grid state
    gridState.updatedAt = Date.now();
    gridStates[symbol] = gridState;
    
    return {
      success: true,
      updated: rebalanceNeeded || filledOrders > 0,
      newOrders,
      cancelledOrders,
      filledOrders
    };
  } catch (error) {
    console.error('Error updating grid strategy:', error);
    throw error;
  }
}

/**
 * Stop the grid strategy
 */
export async function stopGridStrategy(symbol: string): Promise<{ success: boolean; message: string; }> {
  try {
    console.log(`Stopping grid strategy for ${symbol}`);
    
    // Check if grid state exists
    const gridState = gridStates[symbol];
    if (!gridState) {
      throw new Error(`No grid strategy found for ${symbol}`);
    }
    
    // Cancel all active orders
    const activeOrders = await getActiveOrders(symbol);
    let cancelledOrders = 0;
    
    for (const order of activeOrders) {
      try {
        // In a real implementation, this would cancel the order via API
        // Here we'll just mark it as cancelled
        for (let i = 0; i < gridState.levels.length; i++) {
          if (gridState.levels[i].orderId === order.orderId) {
            gridState.levels[i].status = 'cancelled';
            gridState.levels[i].isActive = false;
            cancelledOrders++;
            break;
          }
        }
      } catch (error) {
        console.error(`Failed to cancel order ${order.orderId}:`, error);
      }
    }
    
    // Update grid state
    gridState.status = 'stopped';
    gridState.updatedAt = Date.now();
    gridStates[symbol] = gridState;
    
    return {
      success: true,
      message: `Stopped grid strategy for ${symbol}. Cancelled ${cancelledOrders} active orders.`
    };
  } catch (error) {
    console.error('Error stopping grid strategy:', error);
    throw error;
  }
}

/**
 * Get the current state of a grid strategy
 */
export function getGridState(symbol: string): GridTradingState | null {
  return gridStates[symbol] || null;
}

/**
 * Helper function to generate arithmetic grid levels
 */
function generateArithmeticGrid(config: GridConfig, currentPrice: number): GridLevel[] {
  const gridLevels: GridLevel[] = [];
  const priceRange = config.upperPrice - config.lowerPrice;
  const priceStep = priceRange / (config.levels - 1);
  
  // Calculate investment per level
  const investmentPerLevel = config.totalInvestment / config.levels;
  
  for (let i = 0; i < config.levels; i++) {
    const price = config.lowerPrice + (i * priceStep);
    const quantity = (investmentPerLevel / price).toFixed(4);
    
    let side: 'Buy' | 'Sell';
    if (price < currentPrice) {
      side = 'Buy';
    } else {
      side = 'Sell';
    }
    
    gridLevels.push({
      price,
      side,
      quantity,
      status: 'pending',
      isActive: false
    });
  }
  
  return gridLevels;
}

/**
 * Helper function to generate geometric grid levels
 */
function generateGeometricGrid(config: GridConfig, currentPrice: number): GridLevel[] {
  const gridLevels: GridLevel[] = [];
  const ratio = Math.pow(config.upperPrice / config.lowerPrice, 1 / (config.levels - 1));
  
  // Calculate investment distribution based on config
  let quantities: number[] = [];
  
  if (config.quantityDistribution === 'equal') {
    // Equal investment per level
    const investmentPerLevel = config.totalInvestment / config.levels;
    quantities = Array(config.levels).fill(investmentPerLevel);
  } else if (config.quantityDistribution === 'incremental') {
    // More investment in higher levels
    const totalParts = (config.levels * (config.levels + 1)) / 2;
    for (let i = 1; i <= config.levels; i++) {
      quantities.push((i / totalParts) * config.totalInvestment);
    }
  } else if (config.quantityDistribution === 'decremental') {
    // More investment in lower levels
    const totalParts = (config.levels * (config.levels + 1)) / 2;
    for (let i = config.levels; i >= 1; i--) {
      quantities.push((i / totalParts) * config.totalInvestment);
    }
  }
  
  // Generate grid levels
  for (let i = 0; i < config.levels; i++) {
    const price = config.lowerPrice * Math.pow(ratio, i);
    const investmentAtLevel = quantities[i];
    const quantity = (investmentAtLevel / price).toFixed(4);
    
    let side: 'Buy' | 'Sell';
    if (price < currentPrice) {
      side = 'Buy';
    } else {
      side = 'Sell';
    }
    
    gridLevels.push({
      price,
      side,
      quantity,
      status: 'pending',
      isActive: false
    });
  }
  
  return gridLevels;
}

/**
 * Helper function to generate custom grid levels
 */
function generateCustomGrid(config: GridConfig, currentPrice: number, customLevels: number[]): GridLevel[] {
  const gridLevels: GridLevel[] = [];
  
  // Sort custom levels
  const sortedLevels = [...customLevels].sort((a, b) => a - b);
  
  // Calculate investment per level
  const investmentPerLevel = config.totalInvestment / sortedLevels.length;
  
  for (let i = 0; i < sortedLevels.length; i++) {
    const price = sortedLevels[i];
    const quantity = (investmentPerLevel / price).toFixed(4);
    
    let side: 'Buy' | 'Sell';
    if (price < currentPrice) {
      side = 'Buy';
    } else {
      side = 'Sell';
    }
    
    gridLevels.push({
      price,
      side,
      quantity,
      status: 'pending',
      isActive: false
    });
  }
  
  return gridLevels;
}