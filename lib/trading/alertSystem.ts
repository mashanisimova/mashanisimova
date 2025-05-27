/**
 * Custom Alert System
 * Manages price alerts, pattern recognition alerts and trade notifications
 */

import { toast } from '@/components/ui/use-toast';

export type AlertType = 'price' | 'pattern' | 'volatility' | 'trade' | 'system';

export interface AlertCondition {
  type: AlertType;
  symbol: string;
  // Price alert properties
  price?: number;
  direction?: 'above' | 'below' | 'cross';
  // Pattern alert properties
  pattern?: string;
  timeframe?: string;
  // Volatility alert properties
  volatilityThreshold?: number;
  // Common properties
  message?: string;
  sound?: boolean;
  email?: boolean;
  telegram?: boolean;
  expiresAt?: string; // ISO date string
  createdAt: string; // ISO date string
  id: string;
  triggered?: boolean;
  triggerCount?: number;
  lastTriggered?: string; // ISO date string
}

const ALERTS_STORAGE_KEY = 'trading_alerts';

/**
 * Add a new alert
 * @param alert Alert condition to add
 * @returns Added alert with generated ID
 */
export function addAlert(alert: Omit<AlertCondition, 'id' | 'createdAt'>): AlertCondition {
  try {
    // Add metadata
    const newAlert: AlertCondition = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      triggered: false,
      triggerCount: 0
    };
    
    // Get existing alerts
    const alerts = getAlerts();
    
    // Add new alert
    alerts.push(newAlert);
    
    // Save alerts
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    
    // Notify user
    toast({
      title: "Alert Created",
      description: `${newAlert.type.charAt(0).toUpperCase() + newAlert.type.slice(1)} alert for ${newAlert.symbol}`,
      variant: "default"
    });
    
    console.log('Alert added:', newAlert);
    return newAlert;
  } catch (error) {
    console.error('Error adding alert:', error);
    throw new Error('Failed to add alert');
  }
}

/**
 * Get all alerts
 * @param activeOnly Only return non-triggered alerts
 * @returns Array of alerts
 */
export function getAlerts(activeOnly: boolean = false): AlertCondition[] {
  try {
    const alertsJson = localStorage.getItem(ALERTS_STORAGE_KEY);
    const alerts: AlertCondition[] = alertsJson ? JSON.parse(alertsJson) : [];
    
    if (activeOnly) {
      // Filter out expired alerts
      const now = new Date().toISOString();
      return alerts.filter(alert => {
        const notExpired = !alert.expiresAt || alert.expiresAt > now;
        const notTriggered = !alert.triggered;
        return notExpired && notTriggered;
      });
    }
    
    return alerts;
  } catch (error) {
    console.error('Error getting alerts:', error);
    return [];
  }
}

/**
 * Delete an alert
 * @param id Alert ID to delete
 * @returns Success status
 */
export function deleteAlert(id: string): boolean {
  try {
    const alerts = getAlerts();
    const filteredAlerts = alerts.filter(alert => alert.id !== id);
    
    if (filteredAlerts.length === alerts.length) {
      return false; // No alert was removed
    }
    
    // Save filtered alerts
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filteredAlerts));
    return true;
  } catch (error) {
    console.error('Error deleting alert:', error);
    return false;
  }
}

/**
 * Check price alerts against current market data
 * @param symbol Trading pair symbol
 * @param currentPrice Current market price
 * @returns Triggered alerts
 */
export function checkPriceAlerts(symbol: string, currentPrice: number): AlertCondition[] {
  try {
    const allAlerts = getAlerts(true);
    const symbolAlerts = allAlerts.filter(alert => 
      alert.type === 'price' && 
      alert.symbol === symbol && 
      alert.price !== undefined
    );
    
    const triggeredAlerts: AlertCondition[] = [];
    
    for (const alert of symbolAlerts) {
      const price = alert.price!;
      const direction = alert.direction || 'cross';
      
      let isTriggered = false;
      
      switch (direction) {
        case 'above':
          isTriggered = currentPrice >= price;
          break;
        case 'below':
          isTriggered = currentPrice <= price;
          break;
        case 'cross':
          // For cross alerts, we need to store the previous price check
          const previousCheck = localStorage.getItem(`price_check_${alert.id}`);
          if (previousCheck) {
            const prevPrice = parseFloat(previousCheck);
            isTriggered = (prevPrice < price && currentPrice >= price) || 
                         (prevPrice > price && currentPrice <= price);
          }
          // Store current price for next check
          localStorage.setItem(`price_check_${alert.id}`, currentPrice.toString());
          break;
      }
      
      if (isTriggered) {
        // Update alert
        alert.triggered = true;
        alert.triggerCount = (alert.triggerCount || 0) + 1;
        alert.lastTriggered = new Date().toISOString();
        
        triggeredAlerts.push(alert);
        
        // Notify user
        notifyAlertTriggered(alert, currentPrice);
      }
    }
    
    if (triggeredAlerts.length > 0) {
      // Update alerts in storage
      updateTriggeredAlerts(triggeredAlerts);
    }
    
    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking price alerts:', error);
    return [];
  }
}

/**
 * Check pattern alerts against technical analysis
 * @param symbol Trading pair symbol
 * @param patterns Detected patterns
 * @returns Triggered alerts
 */
export function checkPatternAlerts(
  symbol: string, 
  patterns: {pattern: string, timeframe: string}[]
): AlertCondition[] {
  try {
    const allAlerts = getAlerts(true);
    const symbolAlerts = allAlerts.filter(alert => 
      alert.type === 'pattern' && 
      alert.symbol === symbol && 
      alert.pattern !== undefined
    );
    
    const triggeredAlerts: AlertCondition[] = [];
    
    for (const alert of symbolAlerts) {
      const patternName = alert.pattern!.toLowerCase();
      const timeframe = alert.timeframe || '';
      
      const isTriggered = patterns.some(p => 
        p.pattern.toLowerCase().includes(patternName) && 
        (timeframe === '' || p.timeframe === timeframe)
      );
      
      if (isTriggered) {
        // Update alert
        alert.triggered = true;
        alert.triggerCount = (alert.triggerCount || 0) + 1;
        alert.lastTriggered = new Date().toISOString();
        
        triggeredAlerts.push(alert);
        
        // Notify user
        notifyAlertTriggered(alert);
      }
    }
    
    if (triggeredAlerts.length > 0) {
      // Update alerts in storage
      updateTriggeredAlerts(triggeredAlerts);
    }
    
    return triggeredAlerts;
  } catch (error) {
    console.error('Error checking pattern alerts:', error);
    return [];
  }
}

/**
 * Create a trade notification alert
 * @param symbol Trading pair symbol
 * @param tradeType 'entry' or 'exit'
 * @param side 'long' or 'short'
 * @param price Trade price
 * @param quantity Trade quantity
 * @param pnl Optional P&L for exits
 * @param strategy Optional strategy name
 */
export function createTradeAlert(
  symbol: string,
  tradeType: 'entry' | 'exit',
  side: 'long' | 'short',
  price: number,
  quantity: number,
  pnl?: number,
  strategy?: string
): void {
  try {
    const direction = side === 'long' ? 'Buy' : 'Sell';
    const action = tradeType === 'entry' ? 'Entered' : 'Exited';
    
    const message = `${action} ${direction} for ${symbol} at ${price} (${quantity} units)${
      pnl ? `, P&L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}` : ''
    }${
      strategy ? ` - ${strategy}` : ''
    }`;
    
    // Create alert object
    const alert: Omit<AlertCondition, 'id' | 'createdAt'> = {
      type: 'trade',
      symbol,
      message,
      sound: true,
      telegram: true,
      email: false
    };
    
    // Add alert (automatically generates ID and timestamps)
    const newAlert = addAlert(alert);
    
    // Immediately mark as triggered since this is a notification
    newAlert.triggered = true;
    newAlert.triggerCount = 1;
    newAlert.lastTriggered = newAlert.createdAt;
    
    // Update alerts in storage
    updateTriggeredAlerts([newAlert]);
    
    // Immediately notify
    notifyAlertTriggered(newAlert);
  } catch (error) {
    console.error('Error creating trade alert:', error);
  }
}

/**
 * Reset triggered status for alerts (e.g., for recurring alerts)
 * @param alertIds Array of alert IDs to reset
 * @returns Number of alerts reset
 */
export function resetAlerts(alertIds: string[]): number {
  try {
    const alerts = getAlerts();
    let resetCount = 0;
    
    for (const alert of alerts) {
      if (alertIds.includes(alert.id)) {
        alert.triggered = false;
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      // Save updated alerts
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    }
    
    return resetCount;
  } catch (error) {
    console.error('Error resetting alerts:', error);
    return 0;
  }
}

/**
 * Update alerts in storage with triggered status
 * @param triggeredAlerts Array of triggered alerts
 */
function updateTriggeredAlerts(triggeredAlerts: AlertCondition[]): void {
  try {
    const alerts = getAlerts();
    
    // Update triggered alerts
    for (const triggered of triggeredAlerts) {
      const index = alerts.findIndex(a => a.id === triggered.id);
      if (index !== -1) {
        alerts[index] = triggered;
      }
    }
    
    // Save updated alerts
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.error('Error updating triggered alerts:', error);
  }
}

/**
 * Notify user when an alert is triggered
 * @param alert Triggered alert
 * @param currentPrice Optional current price for context
 */
function notifyAlertTriggered(alert: AlertCondition, currentPrice?: number): void {
  try {
    // Create notification message
    const title = `${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert: ${alert.symbol}`;
    const description = alert.message || getDefaultAlertMessage(alert, currentPrice);
    
    // Show toast notification
    toast({
      title,
      description,
      variant: alert.type === 'system' ? 'destructive' : 'default',
    });
    
    // Play sound if enabled
    if (alert.sound) {
      playAlertSound();
    }
    
    // Send to Telegram if enabled
    if (alert.telegram) {
      // This would call your Telegram integration
      console.log('Would send Telegram alert:', title, description);
      // sendTelegramAlert(title, description);
    }
    
    console.log('Alert triggered:', alert);
  } catch (error) {
    console.error('Error notifying alert triggered:', error);
  }
}

/**
 * Get default message for an alert
 * @param alert Alert condition
 * @param currentPrice Optional current price
 * @returns Alert message
 */
function getDefaultAlertMessage(alert: AlertCondition, currentPrice?: number): string {
  switch (alert.type) {
    case 'price':
      return `Price ${alert.direction || 'crossed'} ${alert.price}${currentPrice ? ` (Current: ${currentPrice})` : ''}`;
    case 'pattern':
      return `Pattern detected: ${alert.pattern} on ${alert.timeframe || 'any'} timeframe`;
    case 'volatility':
      return `Volatility ${alert.volatilityThreshold}% threshold reached for ${alert.symbol}`;
    case 'trade':
      return `Trade executed for ${alert.symbol}`;
    case 'system':
      return `System alert for ${alert.symbol}`;
    default:
      return `Alert triggered for ${alert.symbol}`;
  }
}

/**
 * Play alert sound
 */
function playAlertSound(): void {
  try {
    const audio = new Audio('/sounds/alert.mp3');
    audio.volume = 0.5;
    audio.play().catch(e => console.error('Could not play alert sound:', e));
  } catch (error) {
    console.error('Error playing alert sound:', error);
  }
}
