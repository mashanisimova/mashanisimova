/**
 * Regulatory Compliance Scanner Module
 * 
 * This module monitors global regulatory developments affecting cryptocurrencies
 * and predicts their market impact, providing early warnings for trading decisions.
 */

export interface RegulatoryEvent {
  id: string;
  country: string;
  region?: string; // e.g., "EU", "Asia-Pacific", etc.
  authority: string; // e.g., "SEC", "CFTC", "European Commission", etc.
  eventType: 'proposal' | 'consultation' | 'ruling' | 'enforcement' | 'legislation' | 'guidance';
  title: string;
  description: string;
  announcementDate: number; // timestamp
  effectiveDate?: number; // timestamp, if different from announcement
  affectedAssets: string[]; // Specific assets affected, empty for all
  affectedCategories: string[]; // e.g., "exchange", "defi", "stablecoin", etc.
  marketImpact: {
    severity: 'negligible' | 'low' | 'medium' | 'high' | 'severe';
    sentiment: 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';
    immediacy: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    pricePrediction?: number; // Estimated percentage impact
  };
  complianceRequirements?: string[];
  links: string[];
  status: 'announced' | 'in_progress' | 'implemented' | 'delayed' | 'abandoned';
  confidence: number; // 0-100, confidence in the assessment
}

export interface JurisdictionRisk {
  country: string;
  overallRisk: 'low' | 'moderate' | 'high' | 'extreme' | 'banned';
  exchangeRestrictions: boolean;
  kycAmlRequirements: 'none' | 'basic' | 'standard' | 'enhanced' | 'prohibitive';
  taxationClarity: 'clear' | 'somewhat_clear' | 'unclear' | 'contradictory';
  assetRestrictions: string[]; // List of restricted asset types
  cbdcStatus: 'none' | 'researching' | 'developing' | 'piloting' | 'launched';
  recentChanges: boolean;
  trend: 'improving' | 'stable' | 'deteriorating';
  notes: string;
}

export interface ComplianceRequirement {
  id: string;
  category: 'kyc' | 'aml' | 'reporting' | 'licensing' | 'consumer_protection' | 'operational' | 'other';
  title: string;
  description: string;
  applicableJurisdictions: string[];
  applicableEntities: string[]; // e.g., "exchanges", "custodians", "issuers", etc.
  implementationDeadline?: number; // timestamp
  penaltiesForNoncompliance?: string;
  complianceSteps: string[];
  resourceLinks: string[];
  lastUpdated: number; // timestamp
}

export interface RegulatoryAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  triggeringEvents: string[]; // IDs of related regulatory events
  affectedAssets: string[];
  expectedImpact: string;
  timeframe: 'immediate' | 'days' | 'weeks' | 'months';
  recommendedActions: string[];
  timestamp: number;
}

// Sample regulatory events (for demonstration)
let regulatoryEvents: RegulatoryEvent[] = [
  {
    id: 'reg-ev-001',
    country: 'United States',
    authority: 'SEC',
    eventType: 'ruling',
    title: 'SEC approves spot Bitcoin ETFs',
    description: 'The U.S. Securities and Exchange Commission has approved applications for spot Bitcoin ETFs, allowing these products to begin trading on regulated exchanges.',
    announcementDate: new Date('2024-01-10').getTime(),
    effectiveDate: new Date('2024-01-11').getTime(),
    affectedAssets: ['BTC'],
    affectedCategories: ['etf', 'institutional'],
    marketImpact: {
      severity: 'high',
      sentiment: 'positive',
      immediacy: 'immediate',
      pricePrediction: 5.2
    },
    links: ['https://www.sec.gov/news/statement/gensler-statement-spot-bitcoin-011023'],
    status: 'implemented',
    confidence: 100
  },
  {
    id: 'reg-ev-002',
    country: 'United States',
    authority: 'SEC',
    eventType: 'enforcement',
    title: 'SEC lawsuit against major cryptocurrency exchange',
    description: 'The SEC has filed a lawsuit against a major cryptocurrency exchange, alleging that the platform offered unregistered securities.',
    announcementDate: new Date('2023-06-05').getTime(),
    affectedAssets: [],
    affectedCategories: ['exchange', 'token_issuance'],
    marketImpact: {
      severity: 'high',
      sentiment: 'negative',
      immediacy: 'immediate',
      pricePrediction: -8.5
    },
    links: [],
    status: 'in_progress',
    confidence: 90
  },
  {
    id: 'reg-ev-003',
    country: 'European Union',
    region: 'EU',
    authority: 'European Commission',
    eventType: 'legislation',
    title: 'MiCA implementation phases begin',
    description: 'The Markets in Crypto-Assets (MiCA) regulation implementation begins with phased approach, establishing a comprehensive regulatory framework for digital assets across the EU.',
    announcementDate: new Date('2023-05-31').getTime(),
    effectiveDate: new Date('2024-06-30').getTime(),
    affectedAssets: [],
    affectedCategories: ['stablecoin', 'exchange', 'custody', 'issuance'],
    marketImpact: {
      severity: 'medium',
      sentiment: 'neutral',
      immediacy: 'medium_term'
    },
    complianceRequirements: [
      'Asset-referenced token issuers must maintain reserves',
      'Stablecoin issuers face limitations on transaction value',
      'Crypto asset service providers must register with national authorities'
    ],
    links: ['https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114'],
    status: 'in_progress',
    confidence: 95
  },
  {
    id: 'reg-ev-004',
    country: 'Japan',
    region: 'Asia-Pacific',
    authority: 'Financial Services Agency',
    eventType: 'guidance',
    title: 'Japan relaxes corporate crypto holdings rules',
    description: 'Japan\'s FSA issues new guidance simplifying the process for companies to hold cryptocurrency on their balance sheets.',
    announcementDate: new Date('2024-02-18').getTime(),
    effectiveDate: new Date('2024-04-01').getTime(),
    affectedAssets: ['BTC', 'ETH'],
    affectedCategories: ['institutional', 'custody'],
    marketImpact: {
      severity: 'medium',
      sentiment: 'positive',
      immediacy: 'medium_term',
      pricePrediction: 2.8
    },
    links: [],
    status: 'announced',
    confidence: 85
  },
  {
    id: 'reg-ev-005',
    country: 'United Kingdom',
    authority: 'FCA',
    eventType: 'consultation',
    title: 'UK consultation on stablecoin regulation',
    description: 'The UK\'s Financial Conduct Authority has opened a consultation on proposed rules for stablecoin issuers and service providers.',
    announcementDate: new Date('2024-01-26').getTime(),
    effectiveDate: new Date('2024-07-15').getTime(),
    affectedAssets: ['USDT', 'USDC', 'GBPT'],
    affectedCategories: ['stablecoin'],
    marketImpact: {
      severity: 'low',
      sentiment: 'neutral',
      immediacy: 'long_term'
    },
    links: [],
    status: 'in_progress',
    confidence: 80
  }
];

// Sample jurisdiction risk data (for demonstration)
const jurisdictionRisks: Record<string, JurisdictionRisk> = {
  'United States': {
    country: 'United States',
    overallRisk: 'moderate',
    exchangeRestrictions: false,
    kycAmlRequirements: 'enhanced',
    taxationClarity: 'somewhat_clear',
    assetRestrictions: ['securities', 'unregistered_offerings'],
    cbdcStatus: 'researching',
    recentChanges: true,
    trend: 'improving',
    notes: 'Evolving regulatory landscape with increased clarity but continued enforcement actions. Spot Bitcoin ETF approval signals regulatory maturation.'
  },
  'China': {
    country: 'China',
    overallRisk: 'banned',
    exchangeRestrictions: true,
    kycAmlRequirements: 'prohibitive',
    taxationClarity: 'unclear',
    assetRestrictions: ['all_cryptocurrencies', 'mining'],
    cbdcStatus: 'launched',
    recentChanges: false,
    trend: 'stable',
    notes: 'Complete ban on cryptocurrency trading and mining. CBDC (e-CNY) widely implemented as government-endorsed alternative.'
  },
  'European Union': {
    country: 'European Union',
    overallRisk: 'moderate',
    exchangeRestrictions: false,
    kycAmlRequirements: 'enhanced',
    taxationClarity: 'somewhat_clear',
    assetRestrictions: [],
    cbdcStatus: 'developing',
    recentChanges: true,
    trend: 'improving',
    notes: 'MiCA framework provides comprehensive regulation across the bloc, bringing increased certainty to the market.'
  },
  'Singapore': {
    country: 'Singapore',
    overallRisk: 'low',
    exchangeRestrictions: false,
    kycAmlRequirements: 'standard',
    taxationClarity: 'clear',
    assetRestrictions: [],
    cbdcStatus: 'researching',
    recentChanges: false,
    trend: 'stable',
    notes: 'Progressive regulatory approach with clear licensing framework for digital asset service providers.'
  },
  'Japan': {
    country: 'Japan',
    overallRisk: 'low',
    exchangeRestrictions: false,
    kycAmlRequirements: 'standard',
    taxationClarity: 'clear',
    assetRestrictions: [],
    cbdcStatus: 'developing',
    recentChanges: true,
    trend: 'improving',
    notes: 'Well-established regulatory framework with recent improvements for institutional adoption.'
  }
};

// Active regulatory alerts
let activeAlerts: RegulatoryAlert[] = [];

/**
 * Initialize the regulatory scanner with current data
 */
export function initRegulatoryScanner(): void {
  console.log('Initializing regulatory compliance scanner');
  
  // In a real implementation, this would:
  // 1. Connect to regulatory news sources and databases
  // 2. Load historical regulatory data
  // 3. Setup monitoring for new announcements
  
  // Generate initial alerts based on existing events
  generateAlerts();
}

/**
 * Get all regulatory events matching specified criteria
 */
export function getRegulatoryEvents(filters?: {
  country?: string;
  authority?: string;
  eventType?: string;
  affectedAsset?: string;
  afterDate?: number;
  status?: string;
  sentiment?: string;
}): RegulatoryEvent[] {
  // Filter events based on criteria
  return regulatoryEvents.filter(event => {
    if (filters?.country && event.country !== filters.country) return false;
    if (filters?.authority && event.authority !== filters.authority) return false;
    if (filters?.eventType && event.eventType !== filters.eventType) return false;
    if (filters?.affectedAsset && !event.affectedAssets.includes(filters.affectedAsset)) return false;
    if (filters?.afterDate && event.announcementDate < filters.afterDate) return false;
    if (filters?.status && event.status !== filters.status) return false;
    if (filters?.sentiment && event.marketImpact.sentiment !== filters.sentiment) return false;
    return true;
  });
}

/**
 * Get risk assessment for a specific jurisdiction
 */
export function getJurisdictionRisk(country: string): JurisdictionRisk | null {
  return jurisdictionRisks[country] || null;
}

/**
 * Get active regulatory alerts
 */
export function getRegulatoryAlerts(assetFilter?: string): RegulatoryAlert[] {
  if (assetFilter) {
    return activeAlerts.filter(alert => 
      alert.affectedAssets.includes(assetFilter) || alert.affectedAssets.length === 0
    );
  }
  return activeAlerts;
}

/**
 * Get regulatory compliance signal for trading decisions
 */
export async function getRegulatorySignal(asset: string): Promise<{
  signal: number; // -100 to 100
  confidence: number; // 0-100
  alerts: RegulatoryAlert[];
  upcomingEvents: RegulatoryEvent[];
  jurisdictionRisks: {
    [country: string]: 'low' | 'moderate' | 'high' | 'extreme' | 'banned';
  };
  regulatoryOutlook: 'improving' | 'stable' | 'deteriorating';
  complianceActions: string[];
}> {
  try {
    // Get relevant alerts for this asset
    const relevantAlerts = getRegulatoryAlerts(asset);
    
    // Get upcoming regulatory events affecting this asset
    const upcomingEvents = getRegulatoryEvents({
      affectedAsset: asset,
      afterDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Events from last 30 days and future
    }).filter(event => 
      event.status === 'announced' || 
      event.status === 'in_progress' ||
      (event.effectiveDate && event.effectiveDate > Date.now())
    );
    
    // Calculate signal based on regulatory events
    let signal = calculateRegulatorySignal(asset);
    
    // Get jurisdiction risks for major markets
    const mainJurisdictions = ['United States', 'European Union', 'Japan', 'Singapore', 'China'];
    const jurisdictionRiskMap: {[country: string]: 'low' | 'moderate' | 'high' | 'extreme' | 'banned'} = {};
    
    for (const country of mainJurisdictions) {
      const risk = getJurisdictionRisk(country);
      if (risk) {
        jurisdictionRiskMap[country] = risk.overallRisk;
      }
    }
    
    // Determine overall regulatory outlook
    const outlook = determineRegulatoryOutlook(asset);
    
    // Generate compliance actions based on relevant events
    const complianceActions = generateComplianceActions(asset);
    
    // Calculate confidence based on data quality and coverage
    const confidence = Math.min(90, 50 + relevantAlerts.length * 5 + upcomingEvents.length * 3);
    
    return {
      signal,
      confidence,
      alerts: relevantAlerts,
      upcomingEvents,
      jurisdictionRisks: jurisdictionRiskMap,
      regulatoryOutlook: outlook,
      complianceActions
    };
  } catch (error) {
    console.error('Error in regulatory signal generation:', error);
    return {
      signal: 0,
      confidence: 0,
      alerts: [],
      upcomingEvents: [],
      jurisdictionRisks: {},
      regulatoryOutlook: 'stable',
      complianceActions: []
    };
  }
}

/* Helper functions */

/**
 * Generate alerts based on regulatory events
 */
function generateAlerts(): void {
  activeAlerts = [];
  
  // Process recent and upcoming events
  for (const event of regulatoryEvents) {
    // Only process recent or upcoming events with significant impact
    const isRecent = Date.now() - event.announcementDate < 30 * 24 * 60 * 60 * 1000; // Within 30 days
    const isUpcoming = event.effectiveDate && event.effectiveDate > Date.now();
    const isSignificant = event.marketImpact.severity === 'high' || event.marketImpact.severity === 'severe';
    
    if ((isRecent || isUpcoming) && isSignificant) {
      // Create an alert
      const alert: RegulatoryAlert = {
        id: `alert-${event.id}`,
        severity: event.marketImpact.severity === 'severe' ? 'critical' : 'warning',
        title: `Regulatory Alert: ${event.title}`,
        description: event.description,
        triggeringEvents: [event.id],
        affectedAssets: event.affectedAssets,
        expectedImpact: `Expected ${event.marketImpact.sentiment} impact on ${event.affectedAssets.length > 0 ? event.affectedAssets.join(', ') : 'affected cryptocurrencies'}`,
        timeframe: event.marketImpact.immediacy === 'immediate' ? 'immediate' : 
                  event.marketImpact.immediacy === 'short_term' ? 'days' :
                  event.marketImpact.immediacy === 'medium_term' ? 'weeks' : 'months',
        recommendedActions: generateRecommendedActions(event),
        timestamp: Date.now()
      };
      
      activeAlerts.push(alert);
    }
  }
}

/**
 * Generate recommended actions based on a regulatory event
 */
function generateRecommendedActions(event: RegulatoryEvent): string[] {
  const actions: string[] = [];
  
  switch (event.eventType) {
    case 'enforcement':
      if (event.marketImpact.sentiment === 'negative' || event.marketImpact.sentiment === 'very_negative') {
        actions.push(`Consider reducing exposure to ${event.affectedAssets.length > 0 ? event.affectedAssets.join(', ') : 'affected assets'}.`);
        actions.push('Monitor for similar enforcement actions against other entities.');
      }
      break;
      
    case 'legislation':
    case 'ruling':
      if (event.complianceRequirements && event.complianceRequirements.length > 0) {
        actions.push('Review compliance requirements for your jurisdiction.');
      }
      
      if (event.marketImpact.sentiment === 'positive' || event.marketImpact.sentiment === 'very_positive') {
        actions.push(`Consider the improved regulatory clarity for ${event.affectedCategories.join(', ')} in your investment strategy.`);
      } else if (event.marketImpact.sentiment === 'negative' || event.marketImpact.sentiment === 'very_negative') {
        actions.push(`Be prepared for potential market volatility in ${event.affectedCategories.join(', ')} sector.`);
      }
      break;
      
    case 'proposal':
    case 'consultation':
      actions.push('Monitor the development of this regulatory initiative.');
      if (event.effectiveDate) {
        const dateStr = new Date(event.effectiveDate).toLocaleDateString();
        actions.push(`Prepare for potential changes by ${dateStr}.`);
      }
      break;
  }
  
  // Add general action if none generated
  if (actions.length === 0) {
    actions.push('Stay informed about evolving regulatory developments in this area.');
  }
  
  return actions;
}

/**
 * Calculate regulatory signal for a specific asset
 */
function calculateRegulatorySignal(asset: string): number {
  let signal = 0;
  let eventCount = 0;
  
  // Consider recent and upcoming events (last 90 days and next 90 days)
  const relevantTimeframe = 90 * 24 * 60 * 60 * 1000; // 90 days in ms
  const relevantEvents = regulatoryEvents.filter(event => 
    (Math.abs(Date.now() - event.announcementDate) < relevantTimeframe ||
     (event.effectiveDate && Math.abs(Date.now() - event.effectiveDate) < relevantTimeframe)) &&
    (event.affectedAssets.includes(asset) || event.affectedAssets.length === 0)
  );
  
  for (const event of relevantEvents) {
    // Skip events with negligible impact
    if (event.marketImpact.severity === 'negligible') continue;
    
    // Calculate base impact value
    let impactValue = 0;
    
    // Convert sentiment to signal contribution
    switch (event.marketImpact.sentiment) {
      case 'very_positive': impactValue = 40; break;
      case 'positive': impactValue = 20; break;
      case 'neutral': impactValue = 0; break;
      case 'negative': impactValue = -20; break;
      case 'very_negative': impactValue = -40; break;
    }
    
    // Adjust for severity
    const severityMultiplier = event.marketImpact.severity === 'severe' ? 1.5 :
                              event.marketImpact.severity === 'high' ? 1.0 :
                              event.marketImpact.severity === 'medium' ? 0.6 : 0.3;
    
    impactValue *= severityMultiplier;
    
    // Adjust for immediacy (time decay)
    const immediacyMultiplier = event.marketImpact.immediacy === 'immediate' ? 1.0 :
                               event.marketImpact.immediacy === 'short_term' ? 0.8 :
                               event.marketImpact.immediacy === 'medium_term' ? 0.5 : 0.2;
    
    impactValue *= immediacyMultiplier;
    
    // Adjust for status
    const statusMultiplier = event.status === 'implemented' ? 1.0 :
                             event.status === 'in_progress' ? 0.8 :
                             event.status === 'announced' ? 0.6 :
                             event.status === 'delayed' ? 0.4 : 0.2;
    
    impactValue *= statusMultiplier;
    
    // Adjust for confidence
    impactValue *= event.confidence / 100;
    
    // Add to cumulative signal
    signal += impactValue;
    eventCount++;
  }
  
  // Check jurisdiction risks
  const mainJurisdictions = ['United States', 'European Union', 'United Kingdom', 'Japan', 'Singapore'];
  let jurisdictionRiskModifier = 0;
  
  for (const country of mainJurisdictions) {
    const risk = getJurisdictionRisk(country);
    if (risk) {
      // Add baseline modification based on jurisdiction risk
      const riskModifier = risk.overallRisk === 'banned' ? -20 :
                           risk.overallRisk === 'extreme' ? -15 :
                           risk.overallRisk === 'high' ? -10 :
                           risk.overallRisk === 'moderate' ? -5 : 0;
      
      // Adjust for trend
      const trendMultiplier = risk.trend === 'improving' ? 0.5 :
                             risk.trend === 'deteriorating' ? 1.5 : 1.0;
      
      jurisdictionRiskModifier += riskModifier * trendMultiplier;
    }
  }
  
  // Apply jurisdiction risk modifier (scaled down by number of jurisdictions)
  signal += jurisdictionRiskModifier / mainJurisdictions.length;
  
  // Normalize signal if we have events, otherwise default to slightly negative
  // (regulatory uncertainty has a mild negative bias)
  if (eventCount > 0) {
    // Ensure signal is within -100 to 100 range
    signal = Math.max(-100, Math.min(100, signal));
  } else {
    signal = -10; // Default slight negative for regulatory uncertainty
  }
  
  return signal;
}

/**
 * Determine the overall regulatory outlook for an asset
 */
function determineRegulatoryOutlook(asset: string): 'improving' | 'stable' | 'deteriorating' {
  // Look at event trends over time
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  
  const olderEvents = regulatoryEvents.filter(event => 
    event.announcementDate >= sixMonthsAgo && event.announcementDate < threeMonthsAgo &&
    (event.affectedAssets.includes(asset) || event.affectedAssets.length === 0)
  );
  
  const recentEvents = regulatoryEvents.filter(event => 
    event.announcementDate >= threeMonthsAgo &&
    (event.affectedAssets.includes(asset) || event.affectedAssets.length === 0)
  );
  
  // Calculate sentiment scores for both periods
  let olderSentimentScore = 0;
  for (const event of olderEvents) {
    const sentimentValue = event.marketImpact.sentiment === 'very_positive' ? 2 :
                         event.marketImpact.sentiment === 'positive' ? 1 :
                         event.marketImpact.sentiment === 'neutral' ? 0 :
                         event.marketImpact.sentiment === 'negative' ? -1 : -2;
    
    olderSentimentScore += sentimentValue;
  }
  
  let recentSentimentScore = 0;
  for (const event of recentEvents) {
    const sentimentValue = event.marketImpact.sentiment === 'very_positive' ? 2 :
                         event.marketImpact.sentiment === 'positive' ? 1 :
                         event.marketImpact.sentiment === 'neutral' ? 0 :
                         event.marketImpact.sentiment === 'negative' ? -1 : -2;
    
    recentSentimentScore += sentimentValue;
  }
  
  // Normalize scores by number of events
  if (olderEvents.length > 0) olderSentimentScore /= olderEvents.length;
  if (recentEvents.length > 0) recentSentimentScore /= recentEvents.length;
  
  // Determine trend
  const sentimentDelta = recentSentimentScore - olderSentimentScore;
  
  if (sentimentDelta > 0.5) {
    return 'improving';
  } else if (sentimentDelta < -0.5) {
    return 'deteriorating';
  } else {
    return 'stable';
  }
}

/**
 * Generate compliance actions based on relevant events
 */
function generateComplianceActions(asset: string): string[] {
  const actions: string[] = [];
  
  // Get relevant events with compliance requirements
  const relevantEvents = regulatoryEvents.filter(event => 
    (event.affectedAssets.includes(asset) || event.affectedAssets.length === 0) &&
    event.complianceRequirements &&
    event.complianceRequirements.length > 0
  );
  
  // Extract compliance actions from events
  for (const event of relevantEvents) {
    if (event.complianceRequirements) {
      for (const requirement of event.complianceRequirements) {
        actions.push(`${event.country}: ${requirement}`);
      }
    }
  }
  
  // Add general compliance action if none found
  if (actions.length === 0) {
    actions.push('Monitor regulatory compliance requirements in your operating jurisdictions.');
  }
  
  return actions;
}

/**
 * Add a new regulatory event (for testing)
 */
export function addRegulatoryEvent(event: RegulatoryEvent): void {
  regulatoryEvents.push(event);
  generateAlerts(); // Regenerate alerts to include the new event
}
