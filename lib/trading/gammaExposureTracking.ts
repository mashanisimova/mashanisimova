/**
 * Gamma Exposure Tracking Module
 * 
 * This advanced module tracks options market gamma exposure and its impact on spot markets.
 * By analyzing dealer hedging requirements around major strikes, it can predict potential
 * price magnetism and volatility around option expiration dates.
 * 
 * Features:
 * - Track aggregate gamma exposure across strikes
 * - Identify gamma flip points (positive to negative gamma levels)
 * - Analyze dealer hedging impact on spot price
 * - Predict volatility around major options expirations
 * - GEX heatmap for major price levels
 */

// Options chain data simulation
function getOptionsChainData(symbol: string, currentPrice: number) {
  // In production, this would fetch actual options chain data
  const expiryDates = [
    new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
  ];
  
  const strikes = [];
  const strikePriceRange = 0.5; // 50% range
  
  // Generate strikes around current price
  for (let i = -10; i <= 10; i++) {
    const strike = currentPrice * (1 + (i * strikePriceRange / 10));
    strikes.push(Math.round(strike / 100) * 100); // Round to nearest 100
  }
  
  // Generate options data for each expiry and strike
  const optionsData = [];
  
  expiryDates.forEach(expiry => {
    const daysToExpiry = Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    strikes.forEach(strike => {
      // Call option
      const callIV = 0.5 + (Math.random() * 0.5); // 50-100% IV
      const callOI = Math.floor(Math.random() * 1000) * 10; // Open interest
      const callDelta = Math.max(0, Math.min(1, 0.5 + ((currentPrice - strike) / currentPrice) * 2));
      const callGamma = Math.max(0, 0.01 * (1 - Math.abs((strike - currentPrice) / currentPrice) * 10));
      
      // Put option
      const putIV = 0.5 + (Math.random() * 0.5); // 50-100% IV
      const putOI = Math.floor(Math.random() * 1000) * 10; // Open interest
      const putDelta = Math.min(0, Math.max(-1, -0.5 - ((currentPrice - strike) / currentPrice) * 2));
      const putGamma = Math.max(0, 0.01 * (1 - Math.abs((strike - currentPrice) / currentPrice) * 10));
      
      optionsData.push({
        type: 'call',
        strike,
        expiry: expiry.toISOString().split('T')[0],
        daysToExpiry,
        iv: callIV,
        openInterest: callOI,
        delta: callDelta,
        gamma: callGamma,
        vega: 0.1 * Math.sqrt(daysToExpiry / 365) * callIV,
        theta: -0.05 * callIV / Math.sqrt(daysToExpiry / 365),
      });
      
      optionsData.push({
        type: 'put',
        strike,
        expiry: expiry.toISOString().split('T')[0],
        daysToExpiry,
        iv: putIV,
        openInterest: putOI,
        delta: putDelta,
        gamma: putGamma,
        vega: 0.1 * Math.sqrt(daysToExpiry / 365) * putIV,
        theta: -0.05 * putIV / Math.sqrt(daysToExpiry / 365),
      });
    });
  });
  
  return optionsData;
}

// Calculate gamma exposure by strike
function calculateGammaExposure(optionsData: any[], currentPrice: number) {
  // Group by strike
  const strikeGamma: Record<number, number> = {};
  
  optionsData.forEach(option => {
    const { strike, gamma, openInterest, type } = option;
    const contractMultiplier = 1; // BTC-USD is often 1 BTC per contract
    const notionalGamma = gamma * openInterest * contractMultiplier * currentPrice;
    
    if (!strikeGamma[strike]) {
      strikeGamma[strike] = 0;
    }
    
    // Dealers are short options, so their gamma exposure is negative of the option gamma
    strikeGamma[strike] -= notionalGamma;
  });
  
  // Convert to array and sort by strike
  const gammaByStrike = Object.entries(strikeGamma).map(([strike, gamma]) => ({
    strike: Number(strike),
    gamma,
    normalized: gamma / 1000000, // Normalize to millions
  })).sort((a, b) => a.strike - b.strike);
  
  return gammaByStrike;
}

// Find gamma flip points (where dealer gamma exposure changes sign)
function findGammaFlipPoints(gammaByStrike: any[], currentPrice: number) {
  const flipPoints = [];
  
  for (let i = 1; i < gammaByStrike.length; i++) {
    const prevGamma = gammaByStrike[i-1].gamma;
    const currGamma = gammaByStrike[i].gamma;
    
    if ((prevGamma < 0 && currGamma >= 0) || (prevGamma >= 0 && currGamma < 0)) {
      // Interpolate to find exact flip point
      const prevStrike = gammaByStrike[i-1].strike;
      const currStrike = gammaByStrike[i].strike;
      
      const ratio = Math.abs(prevGamma) / (Math.abs(prevGamma) + Math.abs(currGamma));
      const flipPrice = prevStrike + (currStrike - prevStrike) * ratio;
      
      const direction = prevGamma < 0 ? 'negative-to-positive' : 'positive-to-negative';
      const strength = Math.abs(prevGamma) + Math.abs(currGamma);
      
      flipPoints.push({
        price: flipPrice,
        direction,
        strength: strength / 1000000, // Normalize to millions
        priceChange: ((flipPrice - currentPrice) / currentPrice) * 100,
      });
    }
  }
  
  return flipPoints;
}

// Calculate aggregate gamma exposure
function calculateAggregateGamma(gammaByStrike: any[]) {
  return gammaByStrike.reduce((sum, item) => sum + item.gamma, 0) / 1000000; // Normalize to millions
}

// Generate a gamma exposure heatmap
function generateGammaHeatmap(gammaByStrike: any[], currentPrice: number) {
  // Find max absolute gamma value for normalization
  const maxGamma = Math.max(...gammaByStrike.map(item => Math.abs(item.gamma)));
  
  // Generate heatmap data
  const heatmapData = gammaByStrike.map(item => ({
    strike: item.strike,
    percentFromCurrent: ((item.strike - currentPrice) / currentPrice) * 100,
    gamma: item.gamma,
    intensity: Math.abs(item.gamma) / maxGamma,
    type: item.gamma >= 0 ? 'positive' : 'negative',
  }));
  
  return heatmapData;
}

// Analyze option expiration effects
function analyzeExpirationEffects(optionsData: any[]) {
  // Group by expiry date
  const expiryMap: Record<string, any[]> = {};
  
  optionsData.forEach(option => {
    if (!expiryMap[option.expiry]) {
      expiryMap[option.expiry] = [];
    }
    expiryMap[option.expiry].push(option);
  });
  
  // Calculate gamma and open interest for each expiry
  const expiryEffects = Object.entries(expiryMap).map(([expiry, options]) => {
    const totalGamma = options.reduce((sum, option) => sum + option.gamma * option.openInterest, 0);
    const totalOI = options.reduce((sum, option) => sum + option.openInterest, 0);
    const putCallRatio = options.filter(o => o.type === 'put').reduce((sum, o) => sum + o.openInterest, 0) /
                          options.filter(o => o.type === 'call').reduce((sum, o) => sum + o.openInterest, 0);
    
    return {
      expiry,
      daysToExpiry: options[0].daysToExpiry,
      totalGamma: totalGamma / 1000000, // Normalize to millions
      totalOpenInterest: totalOI,
      putCallRatio,
      estimatedVolatilityImpact: Math.abs(totalGamma) / (10000 * totalOI) * 100, // Estimate % impact
    };
  }).sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  
  return expiryEffects;
}

// Main function to get gamma exposure signals
export function getGammaExposureSignal(symbol: string, currentPrice: number): {
  signal: number;
  confidence: number;
  aggregateGamma: number;
  flipPoints: any[];
  expirationEffects: any[];
  details: any;
} {
  console.log(`Analyzing options gamma exposure for ${symbol} at price $${currentPrice}`);
  
  // Get options chain data
  const optionsData = getOptionsChainData(symbol, currentPrice);
  
  // Calculate gamma exposure by strike
  const gammaByStrike = calculateGammaExposure(optionsData, currentPrice);
  
  // Find gamma flip points
  const flipPoints = findGammaFlipPoints(gammaByStrike, currentPrice);
  
  // Calculate aggregate gamma
  const aggregateGamma = calculateAggregateGamma(gammaByStrike);
  
  // Generate gamma heatmap
  const gammaHeatmap = generateGammaHeatmap(gammaByStrike, currentPrice);
  
  // Analyze option expiration effects
  const expirationEffects = analyzeExpirationEffects(optionsData);
  
  // Generate trading signal based on gamma exposure
  let signal = 0;
  
  // 1. Aggregate gamma influence
  // Positive dealer gamma is generally stabilizing (slightly bullish)
  // Negative dealer gamma can exacerbate moves (slightly bearish)
  signal += aggregateGamma * 0.3;
  
  // 2. Proximity to gamma flip points
  const nearestFlip = flipPoints.reduce((nearest, flip) => {
    const distance = Math.abs(flip.priceChange);
    if (!nearest || distance < Math.abs(nearest.priceChange)) {
      return flip;
    }
    return nearest;
  }, null);
  
  if (nearestFlip) {
    // If we're near a flip point, the signal depends on the direction
    const flipEffect = nearestFlip.direction === 'negative-to-positive' ? 0.2 : -0.2;
    const proximity = Math.max(0, 1 - (Math.abs(nearestFlip.priceChange) / 10)); // Higher value means closer
    signal += flipEffect * proximity * nearestFlip.strength / 5;
  }
  
  // 3. Upcoming expirations
  const upcomingExpiry = expirationEffects.find(e => e.daysToExpiry <= 3);
  if (upcomingExpiry) {
    // Large expirations can cause increased volatility
    signal += (upcomingExpiry.putCallRatio > 1 ? 0.2 : -0.2) * 
               Math.min(1, upcomingExpiry.totalOpenInterest / 10000) * 
               Math.min(1, upcomingExpiry.estimatedVolatilityImpact / 5);
  }
  
  // Normalize signal to -1 to 1 range
  signal = Math.max(-1, Math.min(1, signal));
  
  // Calculate confidence based on options liquidity
  const totalOI = optionsData.reduce((sum, option) => sum + option.openInterest, 0);
  const confidence = Math.min(0.9, 0.4 + Math.min(0.5, totalOI / 50000));
  
  console.log(`Gamma Exposure: ${aggregateGamma.toFixed(2)}M | Signal: ${signal.toFixed(2)} | Confidence: ${(confidence * 100).toFixed(0)}%`);
  
  if (flipPoints.length > 0) {
    console.log(`Gamma Flip Points: ${flipPoints.length}`);
    flipPoints.forEach((flip, i) => {
      console.log(`  Flip #${i+1}: $${flip.price.toFixed(0)} (${flip.priceChange.toFixed(1)}% from current) - ${flip.direction}`);
    });
  }
  
  if (upcomingExpiry) {
    console.log(`Upcoming expiry in ${upcomingExpiry.daysToExpiry} days with ${upcomingExpiry.totalOpenInterest} OI, P/C ratio: ${upcomingExpiry.putCallRatio.toFixed(2)}`);
  }
  
  return {
    signal,
    confidence,
    aggregateGamma,
    flipPoints,
    expirationEffects,
    details: {
      optionsData,
      gammaByStrike,
      gammaHeatmap,
    }
  };
}
