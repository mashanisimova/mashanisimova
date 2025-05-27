'use client';

import {
  RSI,
  EMA,
  SMA,
  BollingerBands,
  MACD,
  ADX,
  CCI,
  Stochastic,
  WilliamsR,
  ATR,
  IchimokuCloud,
  VolumeProfile,
  OBV
} from 'technicalindicators';

export type CandleData = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type IndicatorSignal = {
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100 where 100 is strongest
  meta?: Record<string, any>; // Additional metadata
};

// Utility functions
function getClosePrices(candles: CandleData[]): number[] {
  return candles.map(candle => candle.close);
}

function getHighPrices(candles: CandleData[]): number[] {
  return candles.map(candle => candle.high);
}

function getLowPrices(candles: CandleData[]): number[] {
  return candles.map(candle => candle.low);
}

function getOpenPrices(candles: CandleData[]): number[] {
  return candles.map(candle => candle.open);
}

function getVolumes(candles: CandleData[]): number[] {
  return candles.map(candle => candle.volume || 0);
}

// Mean Reversion
export function mean_reversion_signal(candles: CandleData[], period: number = 14): IndicatorSignal {
  console.log('Calculating Mean Reversion signal');
  if (candles.length < period + 1) {
    return { signal: 'neutral', strength: 0 };
  }

  const closePrices = getClosePrices(candles);
  const sma = SMA.calculate({ period, values: closePrices });
  
  if (sma.length === 0) return { signal: 'neutral', strength: 0 };
  
  const lastSMA = sma[sma.length - 1];
  const lastPrice = closePrices[closePrices.length - 1];
  const prevPrice = closePrices[closePrices.length - 2];
  
  // Calculate deviation from SMA as a percentage
  const deviation = Math.abs((lastPrice - lastSMA) / lastSMA) * 100;
  const maxDeviation = 5; // 5% maximum deviation for full strength
  const deviationStrength = Math.min(deviation / maxDeviation * 100, 100);
  
  // Direction of movement
  const movingTowardsMean = 
    (lastPrice < lastSMA && lastPrice > prevPrice) || // Price below SMA and rising
    (lastPrice > lastSMA && lastPrice < prevPrice);   // Price above SMA and falling
  
  if (lastPrice < lastSMA && movingTowardsMean) {
    return { 
      signal: 'buy', 
      strength: deviationStrength,
      meta: { sma: lastSMA, price: lastPrice, deviation }
    };
  } else if (lastPrice > lastSMA && movingTowardsMean) {
    return { 
      signal: 'sell', 
      strength: deviationStrength,
      meta: { sma: lastSMA, price: lastPrice, deviation }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// EMA Crossover
export function ema_crossover_signal(candles: CandleData[], shortPeriod: number = 9, longPeriod: number = 21): IndicatorSignal {
  console.log('Calculating EMA Crossover signal');
  if (candles.length < longPeriod + 2) {
    return { signal: 'neutral', strength: 0 };
  }

  const closePrices = getClosePrices(candles);
  
  const shortEMA = EMA.calculate({ period: shortPeriod, values: closePrices });
  const longEMA = EMA.calculate({ period: longPeriod, values: closePrices });
  
  if (shortEMA.length < 2 || longEMA.length < 2) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const currentShortEMA = shortEMA[shortEMA.length - 1];
  const previousShortEMA = shortEMA[shortEMA.length - 2];
  const currentLongEMA = longEMA[longEMA.length - 1];
  const previousLongEMA = longEMA[longEMA.length - 2];
  
  const crossedAbove = previousShortEMA <= previousLongEMA && currentShortEMA > currentLongEMA;
  const crossedBelow = previousShortEMA >= previousLongEMA && currentShortEMA < currentLongEMA;
  
  // Calculate the strength based on the percentage difference between the EMAs
  const emaDiff = Math.abs(currentShortEMA - currentLongEMA) / currentLongEMA * 100;
  const maxDiff = 0.5; // 0.5% difference for full strength
  const diffStrength = Math.min(emaDiff / maxDiff * 100, 100);
  
  if (crossedAbove) {
    return { 
      signal: 'buy', 
      strength: diffStrength,
      meta: { shortEMA: currentShortEMA, longEMA: currentLongEMA }
    };
  } else if (crossedBelow) {
    return { 
      signal: 'sell', 
      strength: diffStrength,
      meta: { shortEMA: currentShortEMA, longEMA: currentLongEMA }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// RSI Divergence
export function rsi_divergence_signal(candles: CandleData[], period: number = 14): IndicatorSignal {
  console.log('Calculating RSI Divergence signal');
  if (candles.length < period + 10) { // Need extra candles for divergence
    return { signal: 'neutral', strength: 0 };
  }

  const closePrices = getClosePrices(candles);
  const rsiValues = RSI.calculate({ period, values: closePrices });
  
  if (rsiValues.length < 10) return { signal: 'neutral', strength: 0 };
  
  // Find price highs/lows and corresponding RSI values in the last 10 periods
  const lookbackPeriod = 10;
  const priceSection = closePrices.slice(-lookbackPeriod);
  const rsiSection = rsiValues.slice(-lookbackPeriod);
  
  const priceHighIndex = priceSection.indexOf(Math.max(...priceSection));
  const priceLowIndex = priceSection.indexOf(Math.min(...priceSection));
  
  const priceHighs = [priceSection[priceHighIndex]];
  const priceLows = [priceSection[priceLowIndex]];
  const rsiHighs = [rsiSection[priceHighIndex]];
  const rsiLows = [rsiSection[priceLowIndex]];
  
  // Check for bearish divergence (price making higher highs, RSI making lower highs)
  const bearishDivergence = priceHighs.length >= 2 && 
                            priceHighs[1] > priceHighs[0] && 
                            rsiHighs[1] < rsiHighs[0];
  
  // Check for bullish divergence (price making lower lows, RSI making higher lows)
  const bullishDivergence = priceLows.length >= 2 && 
                           priceLows[1] < priceLows[0] && 
                           rsiLows[1] > rsiLows[0];
  
  // Calculate the current RSI value
  const currentRSI = rsiValues[rsiValues.length - 1];
  
  // Overbought/oversold conditions add to signal strength
  let strengthModifier = 0;
  if (currentRSI > 70) strengthModifier = (currentRSI - 70) * 3.33; // Max +100 at RSI 100
  if (currentRSI < 30) strengthModifier = (30 - currentRSI) * 3.33;  // Max +100 at RSI 0
  
  if (bullishDivergence) {
    return { 
      signal: 'buy', 
      strength: 50 + strengthModifier,
      meta: { rsi: currentRSI }
    };
  } else if (bearishDivergence) {
    return { 
      signal: 'sell', 
      strength: 50 + strengthModifier,
      meta: { rsi: currentRSI }
    };
  } else if (currentRSI < 30) {
    // Oversold condition without divergence - weaker signal
    return { 
      signal: 'buy', 
      strength: strengthModifier,
      meta: { rsi: currentRSI }
    };
  } else if (currentRSI > 70) {
    // Overbought condition without divergence - weaker signal
    return { 
      signal: 'sell', 
      strength: strengthModifier,
      meta: { rsi: currentRSI }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Bollinger Band Squeeze
export function bollinger_squeeze_signal(candles: CandleData[], period: number = 20, stdDev: number = 2): IndicatorSignal {
  console.log('Calculating Bollinger Squeeze signal');
  if (candles.length < period + 5) {
    return { signal: 'neutral', strength: 0 };
  }

  const closePrices = getClosePrices(candles);
  
  const bollingerBands = BollingerBands.calculate({
    period,
    values: closePrices,
    stdDev
  });
  
  if (bollingerBands.length < 5) return { signal: 'neutral', strength: 0 };
  
  // Get the recent Bollinger bands
  const recentBands = bollingerBands.slice(-5);
  
  // Calculate the bandwidth (difference between upper and lower bands)
  const bandwidths = recentBands.map(band => 
    (band.upper - band.lower) / band.middle * 100
  );
  
  // Check if bands are narrowing (squeeze forming)
  const isNarrowing = bandwidths[0] > bandwidths[bandwidths.length - 1];
  
  // Calculate current bandwidth percentage (lower means tighter squeeze)
  const currentBandwidth = bandwidths[bandwidths.length - 1];
  const minBandwidth = 2; // Threshold for tight squeeze
  const maxBandwidth = 8; // Threshold for no squeeze
  
  // Calculate squeeze strength (0-100)
  const bandwidthRange = maxBandwidth - minBandwidth;
  const squeezeStrength = isNarrowing ? 
    Math.max(0, Math.min(100, (maxBandwidth - currentBandwidth) / bandwidthRange * 100)) : 0;
  
  // Current price position within the bands
  const currentPrice = closePrices[closePrices.length - 1];
  const currentBand = bollingerBands[bollingerBands.length - 1];
  
  if (squeezeStrength > 50) {
    // If squeeze is strong, prepare for a breakout but don't signal direction yet
    if (currentPrice > currentBand.upper) {
      // Breakout above upper band
      return { 
        signal: 'buy', 
        strength: squeezeStrength,
        meta: { bandwidth: currentBandwidth, price: currentPrice, upper: currentBand.upper, lower: currentBand.lower }
      };
    } else if (currentPrice < currentBand.lower) {
      // Breakout below lower band
      return { 
        signal: 'sell', 
        strength: squeezeStrength,
        meta: { bandwidth: currentBandwidth, price: currentPrice, upper: currentBand.upper, lower: currentBand.lower }
      };
    }
  }
  
  return { 
    signal: 'neutral', 
    strength: 0,
    meta: { bandwidth: currentBandwidth, price: currentPrice }
  };
}

// Volume Spike
export function volume_spike_signal(candles: CandleData[], period: number = 20): IndicatorSignal {
  console.log('Calculating Volume Spike signal');
  if (candles.length < period || !candles[0].volume) {
    return { signal: 'neutral', strength: 0 };
  }

  const volumes = getVolumes(candles);
  const closePrices = getClosePrices(candles);
  
  // Calculate average volume
  const avgVolume = volumes.slice(-period, -1).reduce((sum, vol) => sum + vol, 0) / (period - 1);
  
  // Get current volume and previous close
  const currentVolume = volumes[volumes.length - 1];
  const currentPrice = closePrices[closePrices.length - 1];
  const previousPrice = closePrices[closePrices.length - 2];
  
  // Calculate volume increase as a multiple of average
  const volumeMultiple = currentVolume / avgVolume;
  
  // Volume spike threshold and maximum multiple for strength calculation
  const spikeThreshold = 2.0;  // 2x average volume
  const maxMultiple = 5.0;     // 5x average for 100% strength
  
  if (volumeMultiple > spikeThreshold) {
    // Calculate strength based on volume spike intensity
    const spikeStrength = Math.min(100, (volumeMultiple - spikeThreshold) / (maxMultiple - spikeThreshold) * 100);
    
    // Determine if the price moved up or down with the volume spike
    const priceChange = (currentPrice - previousPrice) / previousPrice * 100;
    
    // Strong volume with price increase = bullish
    if (priceChange > 0) {
      return { 
        signal: 'buy', 
        strength: spikeStrength,
        meta: { volumeMultiple, priceChange }
      };
    }
    // Strong volume with price decrease = bearish
    else if (priceChange < 0) {
      return { 
        signal: 'sell', 
        strength: spikeStrength,
        meta: { volumeMultiple, priceChange }
      };
    }
  }
  
  return { signal: 'neutral', strength: 0 };
}

// ADX Trend
export function adx_trend_signal(candles: CandleData[], period: number = 14): IndicatorSignal {
  console.log('Calculating ADX Trend signal');
  if (candles.length < period + 2) {
    return { signal: 'neutral', strength: 0 };
  }

  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  const closePrices = getClosePrices(candles);
  
  const adxInput = {
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period
  };
  
  const adxResult = ADX.calculate(adxInput);
  
  if (adxResult.length < 2) return { signal: 'neutral', strength: 0 };
  
  // Get latest ADX values
  const current = adxResult[adxResult.length - 1];
  const previous = adxResult[adxResult.length - 2];
  
  // ADX measures trend strength, not direction
  // ADX > 25 indicates a strong trend
  // +DI > -DI indicates bullish trend
  // -DI > +DI indicates bearish trend
  
  const adxValue = current.adx;
  const plusDI = current.pdi;
  const minusDI = current.mdi;
  
  // Calculate trend strength (0-100 scale)
  // ADX of 25 is minimum for trend, 50+ is very strong
  const trendStrength = Math.min(100, Math.max(0, (adxValue - 15) * 2.85)); // Scaled to make 50 ADX = 100 strength
  
  // DI spread for additional conviction
  const diSpread = Math.abs(plusDI - minusDI) / ((plusDI + minusDI) / 2) * 100;
  const spreadFactor = Math.min(1, diSpread / 20); // Max additional factor of 1 at 20% spread
  
  // ADX rising indicates strengthening trend
  const adxRising = current.adx > previous.adx;
  const momentumFactor = adxRising ? 1.2 : 1.0;
  
  // Final strength is base trend strength adjusted by spread and momentum
  const finalStrength = Math.min(100, trendStrength * spreadFactor * momentumFactor);
  
  if (adxValue > 15) { // Minimum ADX threshold for trend significance
    if (plusDI > minusDI) {
      return { 
        signal: 'buy', 
        strength: finalStrength,
        meta: { adx: adxValue, plusDI, minusDI, rising: adxRising }
      };
    } else if (minusDI > plusDI) {
      return { 
        signal: 'sell', 
        strength: finalStrength,
        meta: { adx: adxValue, plusDI, minusDI, rising: adxRising }
      };
    }
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Supertrend
export function supertrend_signal(candles: CandleData[], period: number = 10, multiplier: number = 3): IndicatorSignal {
  console.log('Calculating Supertrend signal');
  if (candles.length < period + 2) {
    return { signal: 'neutral', strength: 0 };
  }

  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  const closePrices = getClosePrices(candles);
  
  // Calculate ATR first (needed for Supertrend)
  const atrInput = {
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period
  };
  
  const atrValues = ATR.calculate(atrInput);
  
  if (atrValues.length < 2) return { signal: 'neutral', strength: 0 };
  
  // Manual calculation of Supertrend
  const supertrend: number[] = [];
  let upTrend: number[] = [];
  let downTrend: number[] = [];
  
  // Initialize with basic values
  for (let i = 0; i < period; i++) {
    upTrend.push(0);
    downTrend.push(0);
    supertrend.push(0);
  }
  
  // Calculate Supertrend values
  for (let i = period; i < candles.length; i++) {
    const currentATR = atrValues[i - period];
    const currentHigh = highPrices[i];
    const currentLow = lowPrices[i];
    const currentClose = closePrices[i];
    
    // Basic bands
    const basicUpperBand = ((currentHigh + currentLow) / 2) + (multiplier * currentATR);
    const basicLowerBand = ((currentHigh + currentLow) / 2) - (multiplier * currentATR);
    
    // Final bands
    const finalUpperBand = (i === period) ? basicUpperBand : 
      (basicUpperBand < upTrend[i-1] || closePrices[i-1] > upTrend[i-1]) ? 
        basicUpperBand : upTrend[i-1];
        
    const finalLowerBand = (i === period) ? basicLowerBand : 
      (basicLowerBand > downTrend[i-1] || closePrices[i-1] < downTrend[i-1]) ? 
        basicLowerBand : downTrend[i-1];
    
    // Store bands
    upTrend.push(finalUpperBand);
    downTrend.push(finalLowerBand);
    
    // Determine Supertrend value
    let supertrendValue;
    if (i === period) {
      supertrendValue = currentClose <= basicUpperBand ? basicUpperBand : basicLowerBand;
    } else {
      if (supertrend[i-1] === upTrend[i-1] && currentClose <= finalUpperBand) {
        supertrendValue = finalUpperBand;
      } else if (supertrend[i-1] === upTrend[i-1] && currentClose > finalUpperBand) {
        supertrendValue = finalLowerBand;
      } else if (supertrend[i-1] === downTrend[i-1] && currentClose >= finalLowerBand) {
        supertrendValue = finalLowerBand;
      } else if (supertrend[i-1] === downTrend[i-1] && currentClose < finalLowerBand) {
        supertrendValue = finalUpperBand;
      } else {
        supertrendValue = 0; // Should not happen
      }
    }
    
    supertrend.push(supertrendValue);
  }
  
  // Determine signal
  const currentClose = closePrices[closePrices.length - 1];
  const previousClose = closePrices[closePrices.length - 2];
  const currentSupertrend = supertrend[supertrend.length - 1];
  const previousSupertrend = supertrend[supertrend.length - 2];
  
  // Check for crossovers
  const crossedAbove = previousClose < previousSupertrend && currentClose > currentSupertrend;
  const crossedBelow = previousClose > previousSupertrend && currentClose < currentSupertrend;
  
  // Calculate distance from price to supertrend line as percentage
  const distancePercent = Math.abs(currentClose - currentSupertrend) / currentClose * 100;
  const maxDistance = 3; // 3% is considered significant
  const distanceStrength = Math.min(100, distancePercent / maxDistance * 100);
  
  if (crossedAbove) {
    return { 
      signal: 'buy', 
      strength: 80 + (distanceStrength * 0.2), // Base 80 + up to 20 from distance
      meta: { supertrend: currentSupertrend, price: currentClose }
    };
  } else if (crossedBelow) {
    return { 
      signal: 'sell', 
      strength: 80 + (distanceStrength * 0.2),
      meta: { supertrend: currentSupertrend, price: currentClose }
    };
  } else if (currentClose > currentSupertrend) {
    // Price is above supertrend - bullish
    return { 
      signal: 'buy', 
      strength: 50 + (distanceStrength * 0.5), // Base 50 + up to 50 from distance
      meta: { supertrend: currentSupertrend, price: currentClose, trend: 'above' }
    };
  } else if (currentClose < currentSupertrend) {
    // Price is below supertrend - bearish
    return { 
      signal: 'sell', 
      strength: 50 + (distanceStrength * 0.5),
      meta: { supertrend: currentSupertrend, price: currentClose, trend: 'below' }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Combine and weight all signals
// Heikin Ashi Candles
export function calculateHeikinAshi(candles: CandleData[]): CandleData[] {
  if (candles.length === 0) return [];
  
  const haCandles: CandleData[] = [];
  
  // First Heikin-Ashi candle
  const firstCandle = candles[0];
  const firstHA: CandleData = {
    time: firstCandle.time,
    open: (firstCandle.open + firstCandle.close) / 2,
    high: firstCandle.high,
    low: firstCandle.low,
    close: (firstCandle.open + firstCandle.high + firstCandle.low + firstCandle.close) / 4,
    volume: firstCandle.volume
  };
  
  haCandles.push(firstHA);
  
  // Calculate the rest of Heikin-Ashi candles
  for (let i = 1; i < candles.length; i++) {
    const currentCandle = candles[i];
    const prevHA = haCandles[i - 1];
    
    const haOpen = (prevHA.open + prevHA.close) / 2;
    const haClose = (currentCandle.open + currentCandle.high + currentCandle.low + currentCandle.close) / 4;
    const haHigh = Math.max(currentCandle.high, haOpen, haClose);
    const haLow = Math.min(currentCandle.low, haOpen, haClose);
    
    haCandles.push({
      time: currentCandle.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: currentCandle.volume
    });
  }
  
  return haCandles;
}

export function heikin_ashi_signal(candles: CandleData[]): IndicatorSignal {
  console.log('Calculating Heikin Ashi signal');
  if (candles.length < 3) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const haCandles = calculateHeikinAshi(candles);
  const last = haCandles[haCandles.length - 1];
  const prev = haCandles[haCandles.length - 2];
  const prev2 = haCandles[haCandles.length - 3];
  
  // Bullish trend: current candle is bullish (close > open) and body is larger than previous
  const isBullish = last.close > last.open;
  const isBullishStrengthening = isBullish && 
                               (last.close - last.open) > (prev.close - prev.open) && 
                               prev.close > prev.open;
  
  // Bearish trend: current candle is bearish (close < open) and body is larger than previous
  const isBearish = last.close < last.open;
  const isBearishStrengthening = isBearish && 
                              (last.open - last.close) > (prev.open - prev.close) && 
                              prev.close < prev.open;
  
  // Check for trend reversal
  const possibleBullishReversal = prev.close < prev.open && last.close > last.open && prev2.close < prev2.open;
  const possibleBearishReversal = prev.close > prev.open && last.close < last.open && prev2.close > prev2.open;
  
  // Calculate body size as percentage
  const bodyPercent = Math.abs(last.close - last.open) / ((last.high + last.low) / 2) * 100;
  const strengthModifier = Math.min(100, bodyPercent * 10); // Scale up body size
  
  // Calculate signal strength
  let strength = 40 + strengthModifier * 0.6; // Base strength 40 + up to 60 from body size
  
  // Adjust strength based on trend continuation or reversal
  if (isBullishStrengthening || isBearishStrengthening) {
    strength += 10; // Additional strength for trend continuation
  }
  
  if (possibleBullishReversal) {
    return { 
      signal: 'buy', 
      strength: strength, 
      meta: { isBullish, bodyPercent, isReversal: true }
    };
  } else if (possibleBearishReversal) {
    return { 
      signal: 'sell', 
      strength: strength, 
      meta: { isBearish, bodyPercent, isReversal: true }
    };
  } else if (isBullish) {
    return { 
      signal: 'buy', 
      strength: isBullishStrengthening ? strength : strength - 20, 
      meta: { isBullish, bodyPercent, strengthening: isBullishStrengthening }
    };
  } else if (isBearish) {
    return { 
      signal: 'sell', 
      strength: isBearishStrengthening ? strength : strength - 20, 
      meta: { isBearish, bodyPercent, strengthening: isBearishStrengthening }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Fibonacci Retracement
export function fibonacci_retracement_signal(candles: CandleData[], period: number = 50): IndicatorSignal {
  console.log('Calculating Fibonacci Retracement signal');
  if (candles.length < period) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const recentCandles = candles.slice(-period);
  
  // Find the highest high and lowest low in the period
  let highestHigh = -Infinity;
  let lowestLow = Infinity;
  let highestIdx = -1;
  let lowestIdx = -1;
  
  for (let i = 0; i < recentCandles.length; i++) {
    if (recentCandles[i].high > highestHigh) {
      highestHigh = recentCandles[i].high;
      highestIdx = i;
    }
    if (recentCandles[i].low < lowestLow) {
      lowestLow = recentCandles[i].low;
      lowestIdx = i;
    }
  }
  
  const priceRange = highestHigh - lowestLow;
  const fibLevels = {
    level0: lowestLow, // 0%
    level236: lowestLow + priceRange * 0.236,
    level382: lowestLow + priceRange * 0.382,
    level50: lowestLow + priceRange * 0.5,
    level618: lowestLow + priceRange * 0.618,
    level786: lowestLow + priceRange * 0.786,
    level100: highestHigh // 100%
  };
  
  // Determine trend direction (last price move)
  const isUptrend = highestIdx > lowestIdx;
  
  // Get the most recent candle
  const currentCandle = recentCandles[recentCandles.length - 1];
  const currentClose = currentCandle.close;
  const previousClose = recentCandles[recentCandles.length - 2].close;
  
  // Check if price is near any Fibonacci level (within 0.5%)
  const tolerance = priceRange * 0.005;
  let nearestLevel = '';
  let nearestDistance = Infinity;
  
  for (const [level, price] of Object.entries(fibLevels)) {
    const distance = Math.abs(currentClose - price);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLevel = level;
    }
  }
  
  // Check if price is near a Fibonacci level
  const isNearFibLevel = nearestDistance <= tolerance;
  
  // Determine signal based on trend and Fibonacci levels
  if (isUptrend) {
    // In uptrend, buy on retracements to support levels
    if (currentClose < previousClose) { // Price is pulling back
      // Check if near a key support level (0.382, 0.5, 0.618)
      if ((Math.abs(currentClose - fibLevels.level382) <= tolerance) || 
          (Math.abs(currentClose - fibLevels.level50) <= tolerance) || 
          (Math.abs(currentClose - fibLevels.level618) <= tolerance)) {
            
        // Calculate bounce strength
        const bounceStrength = (currentCandle.close - currentCandle.low) / (currentCandle.high - currentCandle.low) * 100;
        
        return { 
          signal: 'buy', 
          strength: 50 + bounceStrength / 2, // 50-100 strength based on bounce
          meta: { 
            nearestLevel, 
            levelPrice: fibLevels[nearestLevel as keyof typeof fibLevels],
            isUptrend,
            bounceStrength
          }
        };
      }
    }
  } else {
    // In downtrend, sell on retracements to resistance levels
    if (currentClose > previousClose) { // Price is pulling back
      // Check if near a key resistance level (0.382, 0.5, 0.618)
      if ((Math.abs(currentClose - fibLevels.level382) <= tolerance) || 
          (Math.abs(currentClose - fibLevels.level50) <= tolerance) || 
          (Math.abs(currentClose - fibLevels.level618) <= tolerance)) {
            
        // Calculate rejection strength
        const rejectionStrength = (currentCandle.high - currentCandle.close) / (currentCandle.high - currentCandle.low) * 100;
        
        return { 
          signal: 'sell', 
          strength: 50 + rejectionStrength / 2, // 50-100 strength based on rejection
          meta: { 
            nearestLevel, 
            levelPrice: fibLevels[nearestLevel as keyof typeof fibLevels],
            isUptrend,
            rejectionStrength
          }
        };
      }
    }
  }
  
  // Breakout scenarios
  if (isUptrend && currentClose > fibLevels.level100 && previousClose <= fibLevels.level100) {
    // Breakout above 100% level in uptrend
    return { 
      signal: 'buy', 
      strength: 80, 
      meta: { breakout: true, level: '100%', isUptrend }
    };
  } else if (!isUptrend && currentClose < fibLevels.level0 && previousClose >= fibLevels.level0) {
    // Breakdown below 0% level in downtrend
    return { 
      signal: 'sell', 
      strength: 80, 
      meta: { breakout: true, level: '0%', isUptrend }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Fractal Breakout
export function fractal_breakout_signal(candles: CandleData[], lookback: number = 5): IndicatorSignal {
  console.log('Calculating Fractal Breakout signal');
  if (candles.length < lookback * 2 + 1) {
    return { signal: 'neutral', strength: 0 };
  }
  
  // Find bullish and bearish fractals
  const bullishFractals: number[] = [];
  const bearishFractals: number[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    // Bearish fractal (high point with lower highs on both sides)
    let isBearishFractal = true;
    for (let j = i - lookback; j < i; j++) {
      if (candles[j].high >= candles[i].high) {
        isBearishFractal = false;
        break;
      }
    }
    for (let j = i + 1; j <= i + lookback; j++) {
      if (candles[j].high >= candles[i].high) {
        isBearishFractal = false;
        break;
      }
    }
    if (isBearishFractal) {
      bearishFractals.push(i);
    }
    
    // Bullish fractal (low point with higher lows on both sides)
    let isBullishFractal = true;
    for (let j = i - lookback; j < i; j++) {
      if (candles[j].low <= candles[i].low) {
        isBullishFractal = false;
        break;
      }
    }
    for (let j = i + 1; j <= i + lookback; j++) {
      if (candles[j].low <= candles[i].low) {
        isBullishFractal = false;
        break;
      }
    }
    if (isBullishFractal) {
      bullishFractals.push(i);
    }
  }
  
  // Check recent candles for breakouts of fractals
  const currentPrice = candles[candles.length - 1].close;
  const previousPrice = candles[candles.length - 2].close;
  
  // Find most recent bearish fractal
  const recentBearishFractals = bearishFractals.filter(i => i < candles.length - 1);
  if (recentBearishFractals.length > 0) {
    const lastBearishFractalIdx = recentBearishFractals[recentBearishFractals.length - 1];
    const bearishLevel = candles[lastBearishFractalIdx].high;
    
    // Breakout above bearish fractal (bullish)
    if (previousPrice <= bearishLevel && currentPrice > bearishLevel) {
      // Calculate breakout strength
      const breakoutPercent = (currentPrice - bearishLevel) / bearishLevel * 100;
      const breakoutStrength = Math.min(100, 60 + breakoutPercent * 20); // 60-100 based on breakout size
      
      return { 
        signal: 'buy', 
        strength: breakoutStrength, 
        meta: { 
          fractalType: 'bearish', 
          breakoutType: 'above',
          fractalPrice: bearishLevel,
          breakoutPercent
        }
      };
    }
  }
  
  // Find most recent bullish fractal
  const recentBullishFractals = bullishFractals.filter(i => i < candles.length - 1);
  if (recentBullishFractals.length > 0) {
    const lastBullishFractalIdx = recentBullishFractals[recentBullishFractals.length - 1];
    const bullishLevel = candles[lastBullishFractalIdx].low;
    
    // Breakdown below bullish fractal (bearish)
    if (previousPrice >= bullishLevel && currentPrice < bullishLevel) {
      // Calculate breakdown strength
      const breakdownPercent = (bullishLevel - currentPrice) / bullishLevel * 100;
      const breakdownStrength = Math.min(100, 60 + breakdownPercent * 20); // 60-100 based on breakdown size
      
      return { 
        signal: 'sell', 
        strength: breakdownStrength, 
        meta: { 
          fractalType: 'bullish', 
          breakoutType: 'below',
          fractalPrice: bullishLevel,
          breakdownPercent
        }
      };
    }
  }
  
  return { signal: 'neutral', strength: 0 };
}

// CCI Indicator
export function cci_signal(candles: CandleData[], period: number = 20): IndicatorSignal {
  console.log('Calculating CCI signal');
  if (candles.length < period + 2) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const closePrices = getClosePrices(candles);
  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  
  const cciInput = {
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period
  };
  
  const cciValues = CCI.calculate(cciInput);
  
  if (cciValues.length < 2) return { signal: 'neutral', strength: 0 };
  
  const currentCCI = cciValues[cciValues.length - 1];
  const previousCCI = cciValues[cciValues.length - 2];
  
  // CCI crossover signals
  const crossAboveNeg100 = previousCCI <= -100 && currentCCI > -100;
  const crossBelow100 = previousCCI >= 100 && currentCCI < 100;
  
  // CCI divergence signals (simplified)
  const isOverbought = currentCCI > 100;
  const isOversold = currentCCI < -100;
  
  // CCI trend change signals
  const bullishTrend = previousCCI < 0 && currentCCI > 0;
  const bearishTrend = previousCCI > 0 && currentCCI < 0;
  
  // Calculate signal strength based on CCI value
  let strength = 0;
  if (isOverbought) {
    strength = Math.min(100, 50 + (currentCCI - 100) / 2);
  } else if (isOversold) {
    strength = Math.min(100, 50 + (Math.abs(currentCCI + 100) / 2));
  } else if (bullishTrend || bearishTrend) {
    strength = 60;
  } else if (crossAboveNeg100 || crossBelow100) {
    strength = 70;
  }
  
  // Generate signals
  if (crossAboveNeg100 || (isOversold && currentCCI > previousCCI)) {
    return {
      signal: 'buy',
      strength,
      meta: { cci: currentCCI, prevCCI: previousCCI, crossover: crossAboveNeg100 }
    };
  } else if (crossBelow100 || (isOverbought && currentCCI < previousCCI)) {
    return {
      signal: 'sell',
      strength,
      meta: { cci: currentCCI, prevCCI: previousCCI, crossover: crossBelow100 }
    };
  } else if (bullishTrend) {
    return {
      signal: 'buy',
      strength,
      meta: { cci: currentCCI, prevCCI: previousCCI, trendChange: true }
    };
  } else if (bearishTrend) {
    return {
      signal: 'sell',
      strength,
      meta: { cci: currentCCI, prevCCI: previousCCI, trendChange: true }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Stochastic Oscillator
export function stochastic_signal(candles: CandleData[], periodK: number = 14, periodD: number = 3): IndicatorSignal {
  console.log('Calculating Stochastic signal');
  if (candles.length < periodK + periodD) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const closePrices = getClosePrices(candles);
  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  
  const stochInput = {
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period: periodK,
    signalPeriod: periodD
  };
  
  const stochValues = Stochastic.calculate(stochInput);
  
  if (stochValues.length < 2) return { signal: 'neutral', strength: 0 };
  
  const current = stochValues[stochValues.length - 1];
  const previous = stochValues[stochValues.length - 2];
  
  const currentK = current.k;
  const currentD = current.d;
  const previousK = previous.k;
  const previousD = previous.d;
  
  // Identify overbought and oversold conditions
  const isOverbought = currentK > 80 && currentD > 80;
  const isOversold = currentK < 20 && currentD < 20;
  
  // Check for K/D crossovers
  const bullishCrossover = previousK <= previousD && currentK > currentD;
  const bearishCrossover = previousK >= previousD && currentK < currentD;
  
  // Calculate signal strength
  let strength = 0;
  
  if (isOversold && bullishCrossover) {
    // Strong buy signal: oversold with bullish crossover
    strength = 90;
  } else if (isOverbought && bearishCrossover) {
    // Strong sell signal: overbought with bearish crossover
    strength = 90;
  } else if (isOversold && currentK > previousK) {
    // Buy signal: oversold with rising K line
    strength = 70;
  } else if (isOverbought && currentK < previousK) {
    // Sell signal: overbought with falling K line
    strength = 70;
  } else if (bullishCrossover) {
    // Moderate buy signal: bullish crossover only
    strength = 60;
  } else if (bearishCrossover) {
    // Moderate sell signal: bearish crossover only
    strength = 60;
  }
  
  // Generate signals
  if ((isOversold && bullishCrossover) || 
      (isOversold && currentK > previousK) || 
      (bullishCrossover && currentK < 50)) {
    return {
      signal: 'buy',
      strength,
      meta: { k: currentK, d: currentD, isOversold, bullishCrossover }
    };
  } else if ((isOverbought && bearishCrossover) || 
             (isOverbought && currentK < previousK) || 
             (bearishCrossover && currentK > 50)) {
    return {
      signal: 'sell',
      strength,
      meta: { k: currentK, d: currentD, isOverbought, bearishCrossover }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Williams %R
export function williams_r_signal(candles: CandleData[], period: number = 14): IndicatorSignal {
  console.log('Calculating Williams %R signal');
  if (candles.length < period + 2) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const closePrices = getClosePrices(candles);
  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  
  const williamsInput = {
    high: highPrices,
    low: lowPrices,
    close: closePrices,
    period
  };
  
  const williamsValues = WilliamsR.calculate(williamsInput);
  
  if (williamsValues.length < 2) return { signal: 'neutral', strength: 0 };
  
  const current = williamsValues[williamsValues.length - 1];
  const previous = williamsValues[williamsValues.length - 2];
  
  // Williams %R ranges from -100 to 0
  // Values below -80 are considered oversold
  // Values above -20 are considered overbought
  
  const isOversold = current < -80;
  const isOverbought = current > -20;
  const wasOversold = previous < -80;
  const wasOverbought = previous > -20;
  
  // Identify potential reversals
  const oversoldReversal = wasOversold && current > previous && current > -80;
  const overboughtReversal = wasOverbought && current < previous && current < -20;
  
  // Trend direction
  const risingIndicator = current > previous;
  const fallingIndicator = current < previous;
  
  // Calculate signal strength
  let strength = 0;
  
  if (oversoldReversal) {
    // Strong buy signal: coming out of oversold
    strength = 80 + Math.min(20, (current + 80) * 1.0); // 80-100 based on distance from -80
  } else if (overboughtReversal) {
    // Strong sell signal: coming out of overbought
    strength = 80 + Math.min(20, (-20 - current) * 1.0); // 80-100 based on distance from -20
  } else if (isOversold && risingIndicator) {
    // Moderate buy signal: oversold and rising
    strength = 60 + Math.min(20, (current + 100) * 0.5); // 60-80 based on current value
  } else if (isOverbought && fallingIndicator) {
    // Moderate sell signal: overbought and falling
    strength = 60 + Math.min(20, (-current) * 0.5); // 60-80 based on current value
  }
  
  // Generate signals
  if (oversoldReversal || (isOversold && risingIndicator)) {
    return {
      signal: 'buy',
      strength,
      meta: { value: current, previous, isOversold, reversal: oversoldReversal }
    };
  } else if (overboughtReversal || (isOverbought && fallingIndicator)) {
    return {
      signal: 'sell',
      strength,
      meta: { value: current, previous, isOverbought, reversal: overboughtReversal }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Parabolic SAR
export function parabolic_sar_signal(candles: CandleData[], step: number = 0.02, max: number = 0.2): IndicatorSignal {
  console.log('Calculating Parabolic SAR signal');
  if (candles.length < 5) {
    return { signal: 'neutral', strength: 0 };
  }
  
  // Manual calculation of Parabolic SAR
  const highPrices = getHighPrices(candles);
  const lowPrices = getLowPrices(candles);
  const closePrices = getClosePrices(candles);
  
  let isUptrend = closePrices[1] > closePrices[0]; // Initial trend direction
  let sar: number[] = [];
  let ep: number[] = []; // Extreme point
  let af = step; // Acceleration factor
  
  // Initialize SAR
  sar[0] = isUptrend ? Math.min(...lowPrices.slice(0, 2)) : Math.max(...highPrices.slice(0, 2));
  ep[0] = isUptrend ? highPrices[1] : lowPrices[1];
  
  // Calculate SAR values
  for (let i = 1; i < candles.length; i++) {
    if (i === 1) {
      sar[i] = sar[0];
      continue;
    }
    
    // Calculate new SAR value
    sar[i] = sar[i-1] + af * (ep[i-2] - sar[i-1]);
    
    // Check if trend reversed
    const prevSAR = sar[i];
    if ((isUptrend && closePrices[i] < prevSAR) || (!isUptrend && closePrices[i] > prevSAR)) {
      // Trend reversal
      isUptrend = !isUptrend;
      sar[i] = isUptrend ? Math.min(...lowPrices.slice(i-2, i+1)) : Math.max(...highPrices.slice(i-2, i+1));
      af = step;
      ep[i-1] = isUptrend ? highPrices[i] : lowPrices[i];
    } else {
      // Continue trend
      if (isUptrend) {
        // Ensure SAR is below the lows of the last two candles
        sar[i] = Math.min(sar[i], lowPrices[i-1], lowPrices[i-2]);
        if (highPrices[i] > ep[i-2]) {
          ep[i-1] = highPrices[i];
          af = Math.min(af + step, max); // Increase acceleration factor
        } else {
          ep[i-1] = ep[i-2];
        }
      } else {
        // Ensure SAR is above the highs of the last two candles
        sar[i] = Math.max(sar[i], highPrices[i-1], highPrices[i-2]);
        if (lowPrices[i] < ep[i-2]) {
          ep[i-1] = lowPrices[i];
          af = Math.min(af + step, max); // Increase acceleration factor
        } else {
          ep[i-1] = ep[i-2];
        }
      }
    }
  }
  
  // Get the current values
  const currentSAR = sar[sar.length - 1];
  const previousSAR = sar[sar.length - 2];
  const currentClose = closePrices[closePrices.length - 1];
  const previousClose = closePrices[closePrices.length - 2];
  
  // Check for trend reversals
  const bullishReversal = previousClose < previousSAR && currentClose > currentSAR;
  const bearishReversal = previousClose > previousSAR && currentClose < currentSAR;
  
  // Current trend status
  const inUptrend = currentClose > currentSAR;
  const inDowntrend = currentClose < currentSAR;
  
  // Distance from price to SAR as percentage (for signal strength)
  const distancePercent = Math.abs(currentClose - currentSAR) / currentClose * 100;
  const maxDistance = 3; // 3% is considered significant
  const distanceStrength = Math.min(100, distancePercent / maxDistance * 100);
  
  // Generate signals
  if (bullishReversal) {
    return {
      signal: 'buy',
      strength: 80 + (distanceStrength * 0.2), // 80-100 based on distance
      meta: { sar: currentSAR, price: currentClose, reversal: true }
    };
  } else if (bearishReversal) {
    return {
      signal: 'sell',
      strength: 80 + (distanceStrength * 0.2), // 80-100 based on distance
      meta: { sar: currentSAR, price: currentClose, reversal: true }
    };
  } else if (inUptrend) {
    // In uptrend but no new reversal
    return {
      signal: 'buy',
      strength: 40 + (distanceStrength * 0.4), // 40-80 based on distance
      meta: { sar: currentSAR, price: currentClose, trend: 'up' }
    };
  } else if (inDowntrend) {
    // In downtrend but no new reversal
    return {
      signal: 'sell',
      strength: 40 + (distanceStrength * 0.4), // 40-80 based on distance
      meta: { sar: currentSAR, price: currentClose, trend: 'down' }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// VWAP (Volume Weighted Average Price)
export function vwap_signal(candles: CandleData[], period: number = 14): IndicatorSignal {
  console.log('Calculating VWAP signal');
  if (candles.length < period || !candles[0].volume) {
    return { signal: 'neutral', strength: 0 };
  }
  
  // Calculate VWAP
  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;
  const vwapValues: number[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const volume = candles[i].volume || 0;
    
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
    
    // Add VWAP value
    const vwap = cumulativeTPV / cumulativeVolume;
    vwapValues.push(vwap);
    
    // Reset for new period (e.g., new day for daily VWAP)
    if (i >= period && i % period === period - 1) {
      cumulativeTPV = 0;
      cumulativeVolume = 0;
    }
  }
  
  // Get the current values
  const currentVWAP = vwapValues[vwapValues.length - 1];
  const currentClose = candles[candles.length - 1].close;
  const previousClose = candles[candles.length - 2].close;
  
  // Calculate distance from price to VWAP as percentage
  const distancePercent = Math.abs(currentClose - currentVWAP) / currentVWAP * 100;
  const maxDistance = 3; // 3% is considered significant
  const distanceStrength = Math.min(100, distancePercent / maxDistance * 100);
  
  // Check for price crossing VWAP
  const crossedAboveVWAP = previousClose < vwapValues[vwapValues.length - 2] && currentClose > currentVWAP;
  const crossedBelowVWAP = previousClose > vwapValues[vwapValues.length - 2] && currentClose < currentVWAP;
  
  // Current price position relative to VWAP
  const aboveVWAP = currentClose > currentVWAP;
  const belowVWAP = currentClose < currentVWAP;
  
  // Generate signals
  if (crossedAboveVWAP) {
    return {
      signal: 'buy',
      strength: 70 + (distanceStrength * 0.3), // 70-100 based on distance
      meta: { vwap: currentVWAP, price: currentClose, crossed: true }
    };
  } else if (crossedBelowVWAP) {
    return {
      signal: 'sell',
      strength: 70 + (distanceStrength * 0.3), // 70-100 based on distance
      meta: { vwap: currentVWAP, price: currentClose, crossed: true }
    };
  } else if (aboveVWAP && currentClose > previousClose) {
    // Above VWAP and price increasing (bullish continuation)
    return {
      signal: 'buy',
      strength: 40 + (distanceStrength * 0.3), // 40-70 based on distance
      meta: { vwap: currentVWAP, price: currentClose, position: 'above' }
    };
  } else if (belowVWAP && currentClose < previousClose) {
    // Below VWAP and price decreasing (bearish continuation)
    return {
      signal: 'sell',
      strength: 40 + (distanceStrength * 0.3), // 40-70 based on distance
      meta: { vwap: currentVWAP, price: currentClose, position: 'below' }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Breakout Detection
export function breakout_signal(candles: CandleData[], period: number = 20): IndicatorSignal {
  console.log('Calculating Breakout signal');
  if (candles.length < period + 5) {
    return { signal: 'neutral', strength: 0 };
  }
  
  // Get recent candles for range calculation
  const recentCandles = candles.slice(-period - 1, -1);
  const currentCandle = candles[candles.length - 1];
  
  // Find highest high and lowest low in the period (the range)
  const highestHigh = Math.max(...recentCandles.map(c => c.high));
  const lowestLow = Math.min(...recentCandles.map(c => c.low));
  
  // Calculate range height
  const rangeHeight = highestHigh - lowestLow;
  const rangePercent = rangeHeight / lowestLow * 100;
  
  // Check if price is breaking out of the range
  const breakoutAbove = currentCandle.close > highestHigh;
  const breakoutBelow = currentCandle.close < lowestLow;
  
  // Volume confirmation
  const hasVolume = !!currentCandle.volume;
  let volumeConfirmation = false;
  
  if (hasVolume) {
    // Calculate average volume
    const avgVolume = recentCandles.reduce((sum, candle) => sum + (candle.volume || 0), 0) / recentCandles.length;
    volumeConfirmation = (currentCandle.volume || 0) > avgVolume * 1.5; // 50% above average
  }
  
  // Calculate breakout strength
  let breakoutStrength = 0;
  
  if (breakoutAbove || breakoutBelow) {
    // Base strength on range size and breakout distance
    const minRangePercent = 2; // Minimum range size for significance
    const maxRangePercent = 10; // Range size for maximum strength
    const rangeStrength = Math.min(100, ((rangePercent - minRangePercent) / (maxRangePercent - minRangePercent)) * 100);
    
    // Breakout distance
    const breakoutDistance = breakoutAbove ? 
      (currentCandle.close - highestHigh) / highestHigh * 100 :
      (lowestLow - currentCandle.close) / lowestLow * 100;
    
    const distanceStrength = Math.min(100, breakoutDistance * 20); // 100% at 5% breakout
    
    // Combine factors
    breakoutStrength = 50 + (rangeStrength * 0.25) + (distanceStrength * 0.25);
    
    // Add volume confirmation bonus
    if (volumeConfirmation) {
      breakoutStrength += 20;
    }
    
    // Cap at 100
    breakoutStrength = Math.min(100, breakoutStrength);
  }
  
  // Generate signals
  if (breakoutAbove) {
    return {
      signal: 'buy',
      strength: breakoutStrength,
      meta: { 
        rangeHigh: highestHigh, 
        rangeLow: lowestLow, 
        breakoutType: 'above',
        volumeConfirmation,
        rangePercent
      }
    };
  } else if (breakoutBelow) {
    return {
      signal: 'sell',
      strength: breakoutStrength,
      meta: { 
        rangeHigh: highestHigh, 
        rangeLow: lowestLow, 
        breakoutType: 'below',
        volumeConfirmation,
        rangePercent
      }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

// Momentum RSI (RSI with momentum confirmation)
export function momentum_rsi_signal(candles: CandleData[], period: number = 14, overbought: number = 70, oversold: number = 30): IndicatorSignal {
  console.log('Calculating Momentum RSI signal');
  if (candles.length < period + 5) {
    return { signal: 'neutral', strength: 0 };
  }
  
  const closePrices = getClosePrices(candles);
  
  // Calculate RSI
  const rsiValues = RSI.calculate({ values: closePrices, period });
  
  if (rsiValues.length < 5) return { signal: 'neutral', strength: 0 };
  
  // Get recent RSI values
  const currentRSI = rsiValues[rsiValues.length - 1];
  const previousRSI = rsiValues[rsiValues.length - 2];
  const rsiSlope = currentRSI - previousRSI;
  
  // Calculate price momentum (simple rate of change)
  const momentumPeriod = 10;
  const currentPrice = closePrices[closePrices.length - 1];
  const priceNPeriodsAgo = closePrices[closePrices.length - 1 - momentumPeriod];
  const priceRateOfChange = (currentPrice - priceNPeriodsAgo) / priceNPeriodsAgo * 100;
  
  // Check for bullish/bearish conditions
  const isOversold = currentRSI < oversold;
  const isOverbought = currentRSI > overbought;
  const rsiRising = rsiSlope > 0;
  const rsiFalling = rsiSlope < 0;
  
  // Check for momentum confirmation
  const positiveMonmentum = priceRateOfChange > 0;
  const negativeMonmentum = priceRateOfChange < 0;
  
  // Calculate strength based on RSI value and momentum
  let strength = 0;
  
  if (isOversold) {
    // Strength increases as RSI gets lower
    strength = 60 + Math.min(30, (oversold - currentRSI) * 1.5);
  } else if (isOverbought) {
    // Strength increases as RSI gets higher
    strength = 60 + Math.min(30, (currentRSI - overbought) * 1.5);
  } else {
    // Middle range, weaker signal
    strength = 40 + Math.abs(rsiSlope) * 10; // Slope intensity affects strength
  }
  
  // Momentum confirmation bonus
  if ((rsiRising && positiveMonmentum) || (rsiFalling && negativeMonmentum)) {
    strength += 10;
  }
  
  // Cap at 100
  strength = Math.min(100, strength);
  
  // Generate signals
  if (isOversold && rsiRising) {
    return {
      signal: 'buy',
      strength,
      meta: { 
        rsi: currentRSI, 
        momentum: priceRateOfChange, 
        rsiSlope,
        confirmed: positiveMonmentum
      }
    };
  } else if (isOverbought && rsiFalling) {
    return {
      signal: 'sell',
      strength,
      meta: { 
        rsi: currentRSI, 
        momentum: priceRateOfChange, 
        rsiSlope,
        confirmed: negativeMonmentum
      }
    };
  } else if (rsiRising && positiveMonmentum && currentRSI > 50) {
    // Bullish momentum with RSI above 50
    return {
      signal: 'buy',
      strength: strength * 0.7, // Reduce strength for non-oversold condition
      meta: { 
        rsi: currentRSI, 
        momentum: priceRateOfChange, 
        rsiSlope,
        confirmed: true
      }
    };
  } else if (rsiFalling && negativeMonmentum && currentRSI < 50) {
    // Bearish momentum with RSI below 50
    return {
      signal: 'sell',
      strength: strength * 0.7, // Reduce strength for non-overbought condition
      meta: { 
        rsi: currentRSI, 
        momentum: priceRateOfChange, 
        rsiSlope,
        confirmed: true
      }
    };
  }
  
  return { signal: 'neutral', strength: 0 };
}

export function combineSignals(signals: Record<string, IndicatorSignal>, macroConditions?: any): IndicatorSignal {
  let buyStrength = 0;
  let sellStrength = 0;
  let totalWeight = 0;
  
  console.log('Combining signals:', signals);
  
  // Define weights for each strategy
  const weights: Record<string, number> = {
    'MeanReversion': 0.5,
    'EMA Crossover': 0.8,
    'RSI Divergence': 0.9,
    'Bollinger Squeeze': 0.7,
    'Volume Spike': 0.6,
    'ADX Trend': 0.8,
    'Supertrend': 1.0,
    'Heikin Ashi': 0.7,
    'Fibonacci Retracement': 0.8,
    'Fractal Breakout': 0.7,
    'CCI': 0.6,
    'Stochastic': 0.7,
    'Williams %R': 0.6,
    'Parabolic SAR': 0.9,
    'VWAP': 0.8,
    'Breakout': 0.9,
    'Momentum RSI': 0.8,
  };
  
  // Add weights for all available strategies
  for (const strategy in signals) {
    const weight = weights[strategy] || 0.5; // Default weight of 0.5 if not specified
    const signal = signals[strategy];
    
    if (signal.signal === 'buy') {
      buyStrength += signal.strength * weight;
    } else if (signal.signal === 'sell') {
      sellStrength += signal.strength * weight;
    }
    
    totalWeight += weight;
  }
  
  // Apply macro condition modifiers if available
  if (macroConditions) {
    // Market fear index can reduce buy signals or enhance sell signals
    if (macroConditions.fearIndex > 75) { // High fear
      sellStrength *= 1.2; // Enhance sell signals by 20%
      buyStrength *= 0.8; // Reduce buy signals by 20%
    } else if (macroConditions.fearIndex < 25) { // Low fear (greed)
      buyStrength *= 1.2; // Enhance buy signals by 20%
      sellStrength *= 0.8; // Reduce sell signals by 20%
    }
    
    // DXY (Dollar Index) influence
    if (macroConditions.dxy && macroConditions.dxyTrend) {
      if (macroConditions.dxyTrend === 'rising') {
        // Rising dollar typically bearish for crypto
        sellStrength *= 1.15;
        buyStrength *= 0.85;
      } else if (macroConditions.dxyTrend === 'falling') {
        // Falling dollar typically bullish for crypto
        buyStrength *= 1.15;
        sellStrength *= 0.85;
      }
    }
    
    // Market volatility adjustment
    if (macroConditions.vix && macroConditions.vix > 25) {
      // High market volatility - reduce overall signal strength
      const volatilityDamper = Math.min(0.9, Math.max(0.6, 1 - (macroConditions.vix - 25) / 50));
      buyStrength *= volatilityDamper;
      sellStrength *= volatilityDamper;
    }
    
    // Risk level adjustment
    if (macroConditions.riskLevel) {
      if (macroConditions.riskLevel === 'high') {
        // Reduce buy signals in high risk environment
        buyStrength *= 0.8;
      } else if (macroConditions.riskLevel === 'low') {
        // Enhance buy signals in low risk environment
        buyStrength *= 1.2;
      }
    }
  }
  
  // Normalize strengths
  if (totalWeight > 0) {
    buyStrength = (buyStrength / totalWeight) * 100;
    sellStrength = (sellStrength / totalWeight) * 100;
  }
  
  // Decision making
  const THRESHOLD = 30; // Minimum strength to generate a signal
  
  if (buyStrength > sellStrength && buyStrength >= THRESHOLD) {
    return { 
      signal: 'buy', 
      strength: Math.min(100, buyStrength),
      meta: { buyStrength, sellStrength }
    };
  } else if (sellStrength > buyStrength && sellStrength >= THRESHOLD) {
    return { 
      signal: 'sell', 
      strength: Math.min(100, sellStrength),
      meta: { buyStrength, sellStrength }
    };
  }
  
  return { 
    signal: 'neutral', 
    strength: 0,
    meta: { buyStrength, sellStrength }
  };
}
