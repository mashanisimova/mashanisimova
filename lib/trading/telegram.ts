'use server';

import TelegramBot from 'node-telegram-bot-api';
import { Trade } from './backtest';

let telegramBot: TelegramBot | null = null;

// Initialize Telegram bot
export async function initTelegramBot(token: string, chatId: string) {
  try {
    if (!telegramBot) {
      console.log('Initializing Telegram bot');
      telegramBot = new TelegramBot(token, { polling: false });
    }
    
    // Test the connection
    const testMessage = await telegramBot.sendMessage(chatId, 'Bybit Trading Bot connected successfully! 🚀');
    console.log('Telegram bot initialized successfully');
    return { success: true, botInfo: testMessage };
  } catch (error) {
    console.error('Failed to initialize Telegram bot:', error);
    return { success: false, error };
  }
}

// Send trade notification
export async function sendTradeNotification(chatId: string, trade: Trade, balanceInfo: { balance: number, change: number }) {
  if (!telegramBot) {
    console.error('Telegram bot not initialized');
    return { success: false, error: 'Bot not initialized' };
  }
  
  try {
    const emoji = trade.profitLoss > 0 ? '🟢' : '🔴';
    const action = trade.side === 'long' ? 'BUY' : 'SELL';
    const profitLossText = trade.profitLoss > 0 ? 'Profit' : 'Loss';
    
    const message = `
${emoji} Trade Executed: ${action}

🤖 Strategy: ${trade.strategy}
📊 Signal Strength: ${trade.signalStrength.toFixed(1)}%

💰 ${profitLossText}: $${Math.abs(trade.profitLoss).toFixed(2)} (${trade.profitLossPercent.toFixed(2)}%)
📈 Entry: $${trade.entryPrice.toFixed(2)}
📉 Exit: $${trade.exitPrice.toFixed(2)}

💼 Current Balance: $${balanceInfo.balance.toFixed(2)} (${balanceInfo.change >= 0 ? '+' : ''}${balanceInfo.change.toFixed(2)}%)
`;

    await telegramBot.sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send trade notification:', error);
    return { success: false, error };
  }
}

// Send daily report
export async function sendDailyReport(chatId: string, report: {
  date: string;
  trades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profit: number;
  profitPercent: number;
  balance: number;
  bestTrade: { profit: number, profitPercent: number, strategy: string };
  worstTrade: { loss: number, lossPercent: number, strategy: string };
}) {
  if (!telegramBot) {
    console.error('Telegram bot not initialized');
    return { success: false, error: 'Bot not initialized' };
  }
  
  try {
    const overallEmoji = report.profit >= 0 ? '🟢' : '🔴';
    const profitSymbol = report.profit >= 0 ? '+' : '';
    
    const message = `
📊 Daily Trading Report: ${report.date} ${overallEmoji}

💰 Daily P/L: ${profitSymbol}$${report.profit.toFixed(2)} (${profitSymbol}${report.profitPercent.toFixed(2)}%)
💼 Current Balance: $${report.balance.toFixed(2)}

🤖 Trades Executed: ${report.trades}
✅ Winning Trades: ${report.winningTrades}
❌ Losing Trades: ${report.losingTrades}
📈 Win Rate: ${report.winRate.toFixed(1)}%

🏆 Best Trade: ${report.bestTrade.strategy} +$${report.bestTrade.profit.toFixed(2)} (${report.bestTrade.profitPercent.toFixed(2)}%)
📉 Worst Trade: ${report.worstTrade.strategy} -$${Math.abs(report.worstTrade.loss).toFixed(2)} (${report.worstTrade.lossPercent.toFixed(2)}%)

🤖 Trading Bot by Masha
`;

    await telegramBot.sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send daily report:', error);
    return { success: false, error };
  }
}

// Send macro conditions update
export async function sendMacroUpdate(chatId: string, macroData: {
  fearIndex: number;
  btcDominance: number;
  trend: string;
  keyEvents: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  tradingRecommendation: string;
}) {
  if (!telegramBot) {
    console.error('Telegram bot not initialized');
    return { success: false, error: 'Bot not initialized' };
  }
  
  try {
    const fearEmoji = macroData.fearIndex < 30 ? '😨' : macroData.fearIndex > 70 ? '😎' : '😐';
    const trendEmoji = macroData.trend === 'Bullish' ? '🚀' : macroData.trend === 'Bearish' ? '🐻' : '↔️';
    const riskEmoji = macroData.riskLevel === 'Low' ? '🟢' : macroData.riskLevel === 'Medium' ? '🟠' : '🔴';
    
    const message = `
🌐 Macro Market Update ${trendEmoji}

📊 Fear & Greed Index: ${macroData.fearIndex} ${fearEmoji}
📈 BTC Dominance: ${macroData.btcDominance.toFixed(2)}%
🔍 Market Trend: ${macroData.trend}

📰 Key Events:
${macroData.keyEvents.map(event => `- ${event}`).join('\n')}

⚠️ Risk Level: ${macroData.riskLevel} ${riskEmoji}

💡 Trading Recommendation:
${macroData.tradingRecommendation}
`;

    await telegramBot.sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send macro update:', error);
    return { success: false, error };
  }
}

// Send error notification
export async function sendErrorNotification(chatId: string, error: { message: string, context: string }) {
  if (!telegramBot) {
    console.error('Telegram bot not initialized');
    return { success: false, error: 'Bot not initialized' };
  }
  
  try {
    const message = `
⚠️ Trading Bot Error Alert ⚠️

❌ Error: ${error.message}
📄 Context: ${error.context}

🕒 Time: ${new Date().toISOString()}

Please check the bot dashboard for more details.
`;

    await telegramBot.sendMessage(chatId, message);
    return { success: true };
  } catch (error) {
    console.error('Failed to send error notification:', error);
    return { success: false, error };
  }
}
