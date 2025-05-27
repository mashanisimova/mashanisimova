'use server';

import { TradeRecord } from './autoTrader';
import { getWalletBalance, getAccountHistory } from '@/lib/api/bybit';
import { format } from 'date-fns';

// Types for tax reporting
type TaxableTrade = {
  date: string;
  symbol: string;
  side: 'Buy' | 'Sell';
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  feeCurrency: string;
  pnl?: number;
  holdingPeriod?: number; // in days
  isShortTerm?: boolean; // true if holding period < 365 days
};

type TaxReport = {
  year: number;
  totalPnL: number;
  shortTermPnL: number;
  longTermPnL: number;
  totalFees: number;
  totalTrades: number;
  taxableAmount: number;
  estimatedTaxRate: number;
  estimatedTax: number;
  trades: TaxableTrade[];
  monthlySummary: {
    month: string;
    pnl: number;
    trades: number;
  }[];
  unrealizedGains: number;
};

type ExportFormat = 'csv' | 'pdf' | 'json' | 'turbotax' | 'cointracker';

/**
 * Generate comprehensive tax report for a given year
 */
export async function generateTaxReport(year: number = new Date().getFullYear()): Promise<TaxReport> {
  try {
    // Get account history for the specified year
    const startDate = new Date(year, 0, 1).toISOString();
    const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();
    
    const history = await getAccountHistory(startDate, endDate);
    if (!history) {
      throw new Error('Failed to fetch account history for tax reporting');
    }
    
    // Process trades and organize by month
    const trades: TaxableTrade[] = [];
    const monthlyData: Record<string, { pnl: number, trades: number }> = {};
    
    // Initialize monthly data structure
    for (let i = 0; i < 12; i++) {
      const monthName = new Date(year, i, 1).toLocaleString('default', { month: 'short' });
      monthlyData[monthName] = { pnl: 0, trades: 0 };
    }
    
    // Process each trade from history
    history.forEach((item: any) => {
      if (item.type === 'TRADE') {
        const tradeDate = new Date(item.timestamp);
        const month = tradeDate.toLocaleString('default', { month: 'short' });
        
        // Calculate holding period if it's a closing trade
        const holdingPeriod = item.openTime ? 
          Math.floor((tradeDate.getTime() - new Date(item.openTime).getTime()) / (1000 * 60 * 60 * 24)) : 
          0;
        
        const taxableTrade: TaxableTrade = {
          date: format(tradeDate, 'yyyy-MM-dd HH:mm:ss'),
          symbol: item.symbol,
          side: item.side,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          totalAmount: parseFloat(item.quantity) * parseFloat(item.price),
          fee: parseFloat(item.fee),
          feeCurrency: item.feeCurrency,
          pnl: item.realizedPnl ? parseFloat(item.realizedPnl) : undefined,
          holdingPeriod,
          isShortTerm: holdingPeriod < 365 // US tax standard for short-term
        };
        
        trades.push(taxableTrade);
        
        // Update monthly summary
        if (monthlyData[month]) {
          monthlyData[month].trades += 1;
          if (taxableTrade.pnl) {
            monthlyData[month].pnl += taxableTrade.pnl;
          }
        }
      }
    });
    
    // Calculate total PnL and stats
    let totalPnL = 0;
    let shortTermPnL = 0;
    let longTermPnL = 0;
    let totalFees = 0;
    
    trades.forEach(trade => {
      if (trade.pnl) {
        totalPnL += trade.pnl;
        if (trade.isShortTerm) {
          shortTermPnL += trade.pnl;
        } else {
          longTermPnL += trade.pnl;
        }
      }
      totalFees += trade.fee;
    });
    
    // Create monthly summary array
    const monthlySummary = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      pnl: data.pnl,
      trades: data.trades
    }));
    
    // Sort monthly summary by month
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    monthlySummary.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
    
    // Get current wallet state for unrealized gains calculation
    const walletData = await getWalletBalance();
    const unrealizedGains = walletData ? 
      parseFloat(walletData?.list?.[0]?.unrealizedProfit || '0') : 
      0;
    
    // Estimate tax based on PnL (simplified calculation)
    // In reality, this would need to account for tax brackets, other income, etc.
    const estimatedTaxRate = 0.25; // 25% simplified tax rate
    const taxableAmount = Math.max(0, totalPnL - totalFees); // Fees typically reduce taxable amount
    const estimatedTax = taxableAmount * estimatedTaxRate;
    
    return {
      year,
      totalPnL,
      shortTermPnL,
      longTermPnL,
      totalFees,
      totalTrades: trades.length,
      taxableAmount,
      estimatedTaxRate,
      estimatedTax,
      trades,
      monthlySummary,
      unrealizedGains
    };
  } catch (error: any) {
    console.error('Error generating tax report:', error);
    throw new Error(`Failed to generate tax report: ${error.message}`);
  }
}

/**
 * Export tax report in various formats
 */
export async function exportTaxReport(
  taxReport: TaxReport, 
  format: ExportFormat = 'csv'
): Promise<{ success: boolean, data?: string, error?: string }> {
  try {
    switch (format) {
      case 'csv':
        return { success: true, data: generateCSV(taxReport) };
      case 'json':
        return { success: true, data: JSON.stringify(taxReport, null, 2) };
      case 'turbotax':
        return { success: true, data: generateTurboTaxFormat(taxReport) };
      case 'cointracker':
        return { success: true, data: generateCoinTrackerFormat(taxReport) };
      case 'pdf':
        // This would typically generate a PDF file
        // For this implementation, we return a placeholder
        return { 
          success: true, 
          data: `PDF generation would be implemented with a library like PDFKit. This would be a binary file.` 
        };
      default:
        return { success: false, error: `Unsupported export format: ${format}` };
    }
  } catch (error: any) {
    console.error(`Error exporting tax report as ${format}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate CSV format for tax reporting
 */
function generateCSV(taxReport: TaxReport): string {
  // Headers
  let csv = 'Date,Symbol,Side,Quantity,Price,Total Amount,Fee,Fee Currency,PnL,Holding Period,Is Short Term\n';
  
  // Add each trade
  taxReport.trades.forEach(trade => {
    csv += [
      trade.date,
      trade.symbol,
      trade.side,
      trade.quantity,
      trade.price,
      trade.totalAmount,
      trade.fee,
      trade.feeCurrency,
      trade.pnl || '',
      trade.holdingPeriod || '',
      trade.isShortTerm ? 'Yes' : 'No'
    ].join(',') + '\n';
  });
  
  // Add summary
  csv += '\n"Summary for Tax Year ' + taxReport.year + '"\n';
  csv += 'Total Trades,' + taxReport.totalTrades + '\n';
  csv += 'Total P&L,' + taxReport.totalPnL.toFixed(2) + '\n';
  csv += 'Short-Term P&L,' + taxReport.shortTermPnL.toFixed(2) + '\n';
  csv += 'Long-Term P&L,' + taxReport.longTermPnL.toFixed(2) + '\n';
  csv += 'Total Fees,' + taxReport.totalFees.toFixed(2) + '\n';
  csv += 'Taxable Amount,' + taxReport.taxableAmount.toFixed(2) + '\n';
  csv += 'Estimated Tax Rate,' + (taxReport.estimatedTaxRate * 100).toFixed(0) + '%\n';
  csv += 'Estimated Tax,' + taxReport.estimatedTax.toFixed(2) + '\n';
  
  return csv;
}

/**
 * Generate TurboTax compatible format
 */
function generateTurboTaxFormat(taxReport: TaxReport): string {
  // TurboTax generally accepts specific CSV formats
  // This is a simplified version - in reality, you'd need to match exact TurboTax specifications
  let turboTaxCsv = 'Date,Action,Symbol,Description,Quantity,Price,Amount,Fees,Gain\n';
  
  taxReport.trades.forEach(trade => {
    const action = trade.side === 'Buy' ? 'Buy' : 'Sell';
    const description = `${action} ${trade.symbol}`;
    const amount = trade.totalAmount;
    const gain = trade.pnl || 0;
    
    turboTaxCsv += [
      trade.date.split(' ')[0], // Just the date part
      action,
      trade.symbol,
      description,
      trade.quantity,
      trade.price,
      amount.toFixed(2),
      trade.fee.toFixed(2),
      gain.toFixed(2)
    ].join(',') + '\n';
  });
  
  return turboTaxCsv;
}

/**
 * Generate CoinTracker compatible format
 */
function generateCoinTrackerFormat(taxReport: TaxReport): string {
  // CoinTracker format
  let coinTrackerCsv = 'Date,Type,Exchange,Base Currency,Base Amount,Quote Currency,Quote Amount,Fee Currency,Fee Amount,Classification\n';
  
  taxReport.trades.forEach(trade => {
    const type = trade.side === 'Buy' ? 'Buy' : 'Sell';
    const baseCurrency = trade.symbol.replace('USDT', '');
    const quoteCurrency = 'USDT';
    const baseAmount = trade.quantity;
    const quoteAmount = trade.totalAmount;
    
    coinTrackerCsv += [
      trade.date,
      type,
      'Bybit',
      baseCurrency,
      baseAmount,
      quoteCurrency,
      quoteAmount.toFixed(2),
      trade.feeCurrency,
      trade.fee.toFixed(8),
      'Trading'
    ].join(',') + '\n';
  });
  
  return coinTrackerCsv;
}

/**
 * Calculate and classify capital gains based on holding period
 */
export function calculateCapitalGains(trades: TradeRecord[]): {
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  shortTermCount: number;
  longTermCount: number;
} {
  let shortTermGains = 0;
  let longTermGains = 0;
  let shortTermCount = 0;
  let longTermCount = 0;
  
  // Process each closed trade
  trades.filter(trade => trade.status === 'closed' && trade.profitLoss !== undefined)
    .forEach(trade => {
      // Calculate holding period in days
      const entryTime = new Date(trade.entryTime);
      const exitTime = new Date(trade.exitTime || 0);
      const holdingPeriodDays = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60 * 24));
      
      // Classify as short-term or long-term (US standard: 1 year)
      if (holdingPeriodDays < 365) {
        shortTermGains += trade.profitLoss || 0;
        shortTermCount++;
      } else {
        longTermGains += trade.profitLoss || 0;
        longTermCount++;
      }
    });
  
  return {
    shortTermGains,
    longTermGains,
    totalGains: shortTermGains + longTermGains,
    shortTermCount,
    longTermCount
  };
}
