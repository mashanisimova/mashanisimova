/**
 * Adaptive Position Sizing Module
 * Dynamically adjusts position sizes based on market volatility and risk parameters
 */

interface PositionSizingParams {
  accountBalance: number;
  maxRiskPerTrade: number; // percentage of account to risk (e.g., 1 = 1%)
  symbol: string;
  baseVolatility?: number; // volatility threshold for 100% sizing
  maxLeverage?: number; // optional leverage for margin trading
  minPositionSize?: number; // minimum position size in USD
}

interface PositionSizingResult {
  positionSize: number; // in USD
  maxPositionSize: number; // in USD
  leveragedPositionSize?: number; // if leverage is used
  riskAmount: number; // amount at risk in USD
  volatilityAdjustment: number; // 0-1 scaling factor based on volatility
  stopLossDistance: number; // recommended stop loss distance in % based on volatility
}

/**
 * Calculate Average True Range (ATR) as a volatility measure
 * @param highs Array of high prices
 * @param lows Array of low prices
 * @param closes Array of close prices
 * @param period ATR period
 * @returns ATR value
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): number {
  if (highs.length < period + 1 || highs.length !== lows.length || highs.length !== closes.length) {
    return 0;
  }

  const trueRanges: number[] = [];

  // Calculate True Range for each period
  for (let i = 1; i < highs.length; i++) {
    const previousClose = closes[i - 1];
    const tr = Math.max(
      highs[i] - lows[i], // Current high - current low
      Math.abs(highs[i] - previousClose), // Current high - previous close
      Math.abs(lows[i] - previousClose) // Current low - previous close
    );
    trueRanges.push(tr);
  }

  // Calculate simple moving average of true ranges
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trueRanges[trueRanges.length - 1 - i];
  }

  return sum / period;
}

/**
 * Calculate position size based on volatility
 * @param params Position sizing parameters
 * @param currentVolatility Current market volatility (e.g., ATR as % of price)
 * @returns Position sizing details
 */
export function calculateAdaptivePositionSize(
  params: PositionSizingParams,
  currentVolatility: number
): PositionSizingResult {
  const {
    accountBalance,
    maxRiskPerTrade,
    symbol,
    baseVolatility = 3, // 3% as default volatility threshold
    maxLeverage = 1,
    minPositionSize = 10 // $10 as minimum position size
  } = params;

  // Calculate risk amount in USD
  const riskAmount = accountBalance * (maxRiskPerTrade / 100);

  // Calculate volatility adjustment (inverse relationship - higher volatility = smaller position)
  const volatilityRatio = baseVolatility / currentVolatility;
  const volatilityAdjustment = Math.min(Math.max(volatilityRatio, 0.1), 1.5);

  console.log(`Volatility adjustment for ${symbol}: ${volatilityAdjustment.toFixed(2)} (current volatility: ${currentVolatility.toFixed(2)}%)`);

  // Calculate base position size
  const maxPositionSize = accountBalance * 0.25; // Never use more than 25% of account
  let positionSize = Math.min(riskAmount * 10 * volatilityAdjustment, maxPositionSize);

  // Apply minimum position size
  positionSize = Math.max(positionSize, minPositionSize);

  // Calculate leveraged position size if applicable
  const leveragedPositionSize = maxLeverage > 1 ? positionSize * maxLeverage : undefined;

  // Calculate recommended stop loss distance based on volatility
  const stopLossDistance = Math.max(currentVolatility * 1.5, 1); // At least 1%

  return {
    positionSize,
    maxPositionSize,
    leveragedPositionSize,
    riskAmount,
    volatilityAdjustment,
    stopLossDistance
  };
}

/**
 * Get position size for a specific crypto pair
 * @param symbol Trading pair symbol (e.g., 'BTCUSDT')
 * @param balance Account balance in USD
 * @param volatilityData Recent high/low/close price data for volatility calculation
 * @param maxRisk Maximum risk percentage per trade (default: 1%)
 * @returns Optimal position size in USD
 */
export async function getOptimalPositionSize(
  symbol: string,
  balance: number,
  volatilityData: { highs: number[]; lows: number[]; closes: number[] },
  maxRisk: number = 1
): Promise<{ usdSize: number; stopLossPercent: number }> {
  // Calculate current volatility using ATR as percentage of price
  const atr = calculateATR(
    volatilityData.highs,
    volatilityData.lows,
    volatilityData.closes
  );
  
  const currentPrice = volatilityData.closes[volatilityData.closes.length - 1];
  const volatilityPercent = (atr / currentPrice) * 100;

  // Calculate adaptive position size
  const result = calculateAdaptivePositionSize(
    {
      accountBalance: balance,
      maxRiskPerTrade: maxRisk,
      symbol,
      baseVolatility: getBaseVolatilityForSymbol(symbol)
    },
    volatilityPercent
  );

  return {
    usdSize: result.positionSize,
    stopLossPercent: result.stopLossDistance
  };
}

/**
 * Get base volatility threshold for specific crypto
 * @param symbol Trading pair symbol
 * @returns Base volatility percentage
 */
function getBaseVolatilityForSymbol(symbol: string): number {
  // Default base volatilities by asset
  const baseVolatilities: Record<string, number> = {
    'BTCUSDT': 3.0, // Bitcoin has medium volatility
    'ETHUSDT': 4.0, // Ethereum slightly more volatile
    'SOLUSDT': 7.0, // Solana has higher volatility
    'XRPUSDT': 5.0,
    'DOGEUSDT': 9.0, // Meme coins have highest volatility
    'BNBUSDT': 4.0,
    'ADAUSDT': 6.0,
    'DOTUSDT': 6.0,
    'AVAXUSDT': 7.0,
  };

  // Extract base asset from pair
  const baseAsset = symbol.replace('USDT', '').replace('USD', '');
  const key = `${baseAsset}USDT`;

  return baseVolatilities[key] || 5.0; // Default to 5% if not found
}
