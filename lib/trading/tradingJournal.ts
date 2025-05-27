/**
 * Trading Journal System
 * Allows traders to log and analyze their trades with notes and tags
 */

import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  timestamp: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  strategy: string;
  setup: string;
  notes: string;
  tags: string[];
  images?: string[];
  rating?: 1 | 2 | 3 | 4 | 5;
  mistakes?: string[];
  lessons?: string[];
  emotionalState?: string;
  marketConditions?: string;
}

export interface JournalStatistics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  bestStrategy: string;
  worstStrategy: string;
  bestSymbol: string;
  commonMistakes: {mistake: string, count: number}[];
  commonTags: {tag: string, count: number}[];
}

const JOURNAL_STORAGE_KEY = 'trading_journal_entries';

/**
 * Add a new entry to the trading journal
 * @param entry Journal entry to add
 */
export function addJournalEntry(entry: JournalEntry): void {
  try {
    // Generate ID if not provided
    if (!entry.id) {
      entry.id = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Set timestamp if not provided
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }
    
    // Get existing entries
    const entries = getJournalEntries();
    
    // Add new entry
    entries.unshift(entry); // Add to beginning of array
    
    // Save entries
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    
    toast({
      title: "Journal Entry Added",
      description: `Added entry for ${entry.symbol} ${entry.side}`,
      variant: "default"
    });
    
    console.log('Journal entry added:', entry);
  } catch (error) {
    console.error('Error adding journal entry:', error);
    toast({
      title: "Error",
      description: "Failed to add journal entry",
      variant: "destructive"
    });
  }
}

/**
 * Get all journal entries
 * @returns Array of journal entries
 */
export function getJournalEntries(): JournalEntry[] {
  try {
    const entriesJson = localStorage.getItem(JOURNAL_STORAGE_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return [];
  }
}

/**
 * Update an existing journal entry
 * @param id Entry ID to update
 * @param updatedEntry Updated entry data
 * @returns Success status
 */
export function updateJournalEntry(id: string, updatedEntry: Partial<JournalEntry>): boolean {
  try {
    const entries = getJournalEntries();
    const index = entries.findIndex(entry => entry.id === id);
    
    if (index === -1) {
      return false;
    }
    
    // Update entry
    entries[index] = {...entries[index], ...updatedEntry};
    
    // Save entries
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return false;
  }
}

/**
 * Delete a journal entry
 * @param id Entry ID to delete
 * @returns Success status
 */
export function deleteJournalEntry(id: string): boolean {
  try {
    const entries = getJournalEntries();
    const filteredEntries = entries.filter(entry => entry.id !== id);
    
    if (filteredEntries.length === entries.length) {
      return false; // No entry was removed
    }
    
    // Save filtered entries
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(filteredEntries));
    return true;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return false;
  }
}

/**
 * Get statistics from journal entries
 * @param entries Optional array of entries to analyze (uses all if not provided)
 * @returns Statistics object
 */
export function getJournalStatistics(entries?: JournalEntry[]): JournalStatistics {
  try {
    const journalEntries = entries || getJournalEntries();
    
    // Filter completed trades (with exitPrice)
    const completedTrades = journalEntries.filter(entry => entry.exitPrice !== undefined);
    
    if (completedTrades.length === 0) {
      return createEmptyStatistics();
    }
    
    // Calculate PnL for trades that don't have it
    const tradesWithPnl = completedTrades.map(trade => {
      if (trade.pnl === undefined) {
        const pnl = calculatePnl(trade);
        return {...trade, pnl, pnlPercent: calculatePnlPercent(trade)};
      }
      return trade;
    });
    
    // Basic statistics
    const winningTrades = tradesWithPnl.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = tradesWithPnl.filter(trade => (trade.pnl || 0) < 0);
    
    const totalPnl = tradesWithPnl.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    // Categorize by strategy and symbol
    const strategyPerformance: Record<string, number> = {};
    const symbolPerformance: Record<string, number> = {};
    
    tradesWithPnl.forEach(trade => {
      const pnl = trade.pnl || 0;
      
      // Strategy performance
      if (trade.strategy) {
        strategyPerformance[trade.strategy] = (strategyPerformance[trade.strategy] || 0) + pnl;
      }
      
      // Symbol performance
      symbolPerformance[trade.symbol] = (symbolPerformance[trade.symbol] || 0) + pnl;
    });
    
    // Find best and worst strategy
    let bestStrategy = '';
    let worstStrategy = '';
    let bestStrategyPnl = -Infinity;
    let worstStrategyPnl = Infinity;
    
    Object.entries(strategyPerformance).forEach(([strategy, pnl]) => {
      if (pnl > bestStrategyPnl) {
        bestStrategy = strategy;
        bestStrategyPnl = pnl;
      }
      if (pnl < worstStrategyPnl) {
        worstStrategy = strategy;
        worstStrategyPnl = pnl;
      }
    });
    
    // Find best symbol
    let bestSymbol = '';
    let bestSymbolPnl = -Infinity;
    
    Object.entries(symbolPerformance).forEach(([symbol, pnl]) => {
      if (pnl > bestSymbolPnl) {
        bestSymbol = symbol;
        bestSymbolPnl = pnl;
      }
    });
    
    // Collect common mistakes and tags
    const mistakesMap: Record<string, number> = {};
    const tagsMap: Record<string, number> = {};
    
    tradesWithPnl.forEach(trade => {
      // Count mistakes
      trade.mistakes?.forEach(mistake => {
        mistakesMap[mistake] = (mistakesMap[mistake] || 0) + 1;
      });
      
      // Count tags
      trade.tags?.forEach(tag => {
        tagsMap[tag] = (tagsMap[tag] || 0) + 1;
      });
    });
    
    // Sort mistakes and tags by frequency
    const commonMistakes = Object.entries(mistakesMap)
      .map(([mistake, count]) => ({mistake, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 mistakes
    
    const commonTags = Object.entries(tagsMap)
      .map(([tag, count]) => ({tag, count}))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 tags
    
    return {
      totalTrades: tradesWithPnl.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / tradesWithPnl.length) * 100,
      averageWin: winningTrades.length > 0 ? totalWins / winningTrades.length : 0,
      averageLoss: losingTrades.length > 0 ? totalLosses / losingTrades.length : 0,
      largestWin: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl || 0)) : 0,
      largestLoss: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl || 0)) : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0,
      bestStrategy,
      worstStrategy,
      bestSymbol,
      commonMistakes,
      commonTags
    };
  } catch (error) {
    console.error('Error calculating journal statistics:', error);
    return createEmptyStatistics();
  }
}

/**
 * Calculate PnL for a trade
 * @param trade Trade entry
 * @returns PnL value
 */
function calculatePnl(trade: JournalEntry): number {
  if (!trade.exitPrice) return 0;
  
  const entryValue = trade.entryPrice * trade.quantity;
  const exitValue = trade.exitPrice * trade.quantity;
  
  return trade.side === 'long' 
    ? exitValue - entryValue 
    : entryValue - exitValue;
}

/**
 * Calculate PnL percentage for a trade
 * @param trade Trade entry
 * @returns PnL percentage
 */
function calculatePnlPercent(trade: JournalEntry): number {
  if (!trade.exitPrice) return 0;
  
  const priceDiff = trade.side === 'long'
    ? trade.exitPrice - trade.entryPrice
    : trade.entryPrice - trade.exitPrice;
  
  return (priceDiff / trade.entryPrice) * 100;
}

/**
 * Create empty statistics object
 * @returns Empty statistics
 */
function createEmptyStatistics(): JournalStatistics {
  return {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    profitFactor: 0,
    bestStrategy: '',
    worstStrategy: '',
    bestSymbol: '',
    commonMistakes: [],
    commonTags: []
  };
}

/**
 * Export journal entries as CSV
 * @returns CSV string
 */
export function exportJournalToCsv(): string {
  const entries = getJournalEntries();
  
  if (entries.length === 0) {
    return '';
  }
  
  // Define CSV headers
  const headers = [
    'Date',
    'Symbol',
    'Side',
    'Entry Price',
    'Exit Price',
    'Quantity',
    'P&L',
    'P&L %',
    'Strategy',
    'Setup',
    'Tags',
    'Rating',
    'Notes'
  ];
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...entries.map(entry => {
      return [
        new Date(entry.timestamp).toLocaleString(),
        entry.symbol,
        entry.side,
        entry.entryPrice,
        entry.exitPrice || '',
        entry.quantity,
        entry.pnl || calculatePnl(entry),
        entry.pnlPercent || calculatePnlPercent(entry),
        `"${(entry.strategy || '')}"`,
        `"${(entry.setup || '')}"`,
        `"${((entry.tags || []).join('; '))}"`,
        entry.rating || '',
        `"${(entry.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    })
  ].join('\n');
  
  return csvContent;
}

/**
 * Import journal entries from CSV
 * @param csvContent CSV content to import
 * @returns Number of entries imported
 */
export function importJournalFromCsv(csvContent: string): number {
  try {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return 0; // No data or only headers
    
    const headers = lines[0].split(',');
    const entries: JournalEntry[] = [];
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCSVLine(lines[i]);
      if (values.length < 8) continue; // Skip invalid lines
      
      const entry: JournalEntry = {
        id: `imported-${Date.now()}-${i}`,
        timestamp: new Date(values[0]).toISOString(),
        symbol: values[1],
        side: values[2].toLowerCase() as 'long' | 'short',
        entryPrice: parseFloat(values[3]),
        exitPrice: values[4] ? parseFloat(values[4]) : undefined,
        quantity: parseFloat(values[5]),
        pnl: values[6] ? parseFloat(values[6]) : undefined,
        pnlPercent: values[7] ? parseFloat(values[7]) : undefined,
        strategy: values[8] ? values[8].replace(/^"|"$/g, '') : '',
        setup: values[9] ? values[9].replace(/^"|"$/g, '') : '',
        notes: values[12] ? values[12].replace(/^"|"$/g, '') : '',
        tags: values[10] ? values[10].replace(/^"|"$/g, '').split(';').map(t => t.trim()) : [],
        rating: values[11] ? parseInt(values[11]) as 1|2|3|4|5 : undefined
      };
      
      entries.push(entry);
    }
    
    // Add all entries
    const currentEntries = getJournalEntries();
    const allEntries = [...entries, ...currentEntries];
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(allEntries));
    
    return entries.length;
  } catch (error) {
    console.error('Error importing journal from CSV:', error);
    throw new Error('Failed to import journal data');
  }
}

/**
 * Parse a CSV line respecting quoted fields
 * @param line CSV line to parse
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (i < line.length - 1 && line[i + 1] === '"') {
        // Escaped quote inside quotes
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}