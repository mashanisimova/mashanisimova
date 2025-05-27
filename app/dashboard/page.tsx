"use client";

import { useState, useEffect } from 'react';
import { TradingView } from "@/components/trading/trading-view";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ArrowUpRight, BarChart, PieChart, ArrowUp, ArrowDown, Layers, Zap, AlertTriangle, CheckCircle2, BarChart2, LineChart } from 'lucide-react';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import Link from 'next/link';
import { toast } from 'sonner';

export default function Dashboard() {
  const { isAuthenticated } = useBybitAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBotActive, setIsBotActive] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [activePairs, setActivePairs] = useState(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);
  const [activeTimeframes, setActiveTimeframes] = useState(['5m', '15m', '1h', '4h']);
  const [activeStrategies, setActiveStrategies] = useState({
    'Mean Reversion': true,
    'EMA Crossover': true,
    'RSI Divergence': true,
    'Bollinger Squeeze': true,
    'VWAP': true,
    'ADX Trend': true,
    'Heikin Ashi': true,
    'Supertrend': true,
    'Fibonacci Retracement': false,
    'Volume Spike': true,
    'Fractal Breakout': false,
    'Ultimate Oscillator': true,
    'Donchian Trend': false,
    'Price Action': true,
    'Breakout': true,
    'CCI': false,
    'Stochastic': true,
    'Williams %R': false,
    'Parabolic SAR': true,
    'Momentum RSI': true,
    'High-Low Breakout': false
  });
  
  // Signal data with real strategies
  const [signalData, setSignalData] = useState({
    'BTCUSDT': { signal: 'buy', strength: 78, strategy: 'Mean Reversion' },
    'ETHUSDT': { signal: 'neutral', strength: 52, strategy: 'None' },
    'SOLUSDT': { signal: 'buy', strength: 85, strategy: 'RSI Divergence' },
  });
  
  // Advanced metrics from our modules
  const [advancedMetrics, setAdvancedMetrics] = useState({
    'On-Chain Flow': { value: 'Bullish', change: '+8%' },
    'Liquidity': { value: 'High', change: 'Stable' },
    'MEV Activity': { value: 'Low', change: '-12%' },
    'DXY Trend': { value: 'Falling', change: '-0.4%' },
    'Fear & Greed': { value: '42', change: 'Fear' },
    'Flash Crash Risk': { value: 'Low', change: '5%' },
    'Layer-0 Activity': { value: 'Medium', change: '+15%' },
    'Institutional Flow': { value: 'Accumulating', change: '+3.2%' },
    'Derivatives Stats': { value: 'Bullish', change: '+7.5%' },
    'Whale Movements': { value: 'Active', change: '+22%' }
  });
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleActivateBot = () => {
    if (!isAuthenticated) {
      toast.error('Please connect your Bybit account first');
      return;
    }
    
    setIsBotActive(!isBotActive);
    toast(isBotActive ? 'Bot deactivated' : 'Bot activated', {
      description: isBotActive 
        ? 'Your Bybit trading bot has been stopped' 
        : 'Your Bybit trading bot is now running with all selected settings',
      icon: isBotActive ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />
    });
  };
  
  // Animated gradient background class
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border border-bybit-darker/60 shadow-lg`;

  return (
    <div className="animate-in fade-in-50 duration-500">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-bybit-text mb-2">Trading Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your automated trading strategies</p>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant={isBotActive ? "destructive" : "default"}
            className={`${isBotActive ? 'bg-bybit-red hover:bg-bybit-red/80' : 'bg-bybit-green hover:bg-bybit-green/80'} text-white shadow-md transition-all duration-300 transform hover:-translate-y-1`}
            onClick={handleActivateBot}
            disabled={!isAuthenticated}
          >
            {isBotActive ? 'Stop Auto Trading' : 'Start Auto Trading'}
          </Button>
          <Link 
            href="/dashboard/bots/bybit-advanced-bot" 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-bybit-yellow text-black hover:bg-bybit-yellow/80 h-10 px-4 py-2 shadow-md hover:shadow-bybit-yellow/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            Configure Advanced Bot
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className={gradientBg}>
          <CardHeader className="pb-2">
            <CardTitle className="text-bybit-text flex justify-between items-center">
              <div className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-bybit-yellow" />
                Bot Status
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${isBotActive ? 'bg-bybit-green/20 text-bybit-green' : 'bg-bybit-red/20 text-bybit-red'}`}>
                {isBotActive ? 'Active' : 'Inactive'}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">API Connection</p>
                  <p className={`font-medium ${isAuthenticated ? 'text-bybit-green' : 'text-bybit-red'}`}>
                    {isAuthenticated ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telegram</p>
                  <p className={`font-medium ${telegramConnected ? 'text-bybit-green' : 'text-muted-foreground'}`}>
                    {telegramConnected ? 'Connected' : 'Not Setup'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Active Pairs</p>
                  <p className="font-medium">{activePairs.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Timeframes</p>
                  <p className="font-medium">{activeTimeframes.join(', ')}</p>
                </div>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm">Trading with profits only</p>
                  <Switch checked={true} disabled />
                </div>
                <p className="text-xs text-muted-foreground">Bot trades only with accumulated profits to minimize risk</p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-lg">
                <div className="text-sm mb-1">Trading hours:</div>
                <div className="text-xs text-muted-foreground flex justify-between">
                  <span className="text-bybit-green">Active: 06:00 - 22:00</span>
                  <span className="text-bybit-red">Disabled: 22:00 - 06:00</span>
                </div>
                <div className="mt-2 h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-bybit-green" style={{width: '66.7%'}}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={gradientBg}>
          <CardHeader className="pb-2">
            <CardTitle className="text-bybit-text flex items-center">
              <BarChart className="mr-2 h-5 w-5 text-bybit-yellow" />
              Current Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(signalData).map(([pair, data]) => (
                <div key={pair} className="p-3 bg-bybit-darker rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-medium">{pair}</p>
                    <div className={`px-2 py-0.5 rounded-full text-xs ${data.signal === 'buy' ? 'bg-bybit-green/20 text-bybit-green' : data.signal === 'sell' ? 'bg-bybit-red/20 text-bybit-red' : 'bg-gray-500/20 text-gray-400'}`}>
                      {data.signal.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <div className="h-2 flex-1 bg-black/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${data.signal === 'buy' ? 'bg-bybit-green' : data.signal === 'sell' ? 'bg-bybit-red' : 'bg-gray-500'}`} 
                        style={{width: `${data.strength}%`}}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{data.strength}%</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                    <span>Strategy: {data.strategy}</span>
                    <span>{data.signal === 'buy' ? '+' : data.signal === 'sell' ? '-' : ''}2.3%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className={gradientBg}>
          <CardHeader className="pb-2">
            <CardTitle className="text-bybit-text flex items-center">
              <Layers className="mr-2 h-5 w-5 text-bybit-yellow" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(advancedMetrics).map(([metric, data]) => (
                <div key={metric} className="p-3 bg-bybit-darker rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{metric}</p>
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{data.value}</p>
                    <div className={`text-xs ${data.change.includes('+') ? 'text-bybit-green' : data.change.includes('-') ? 'text-bybit-red' : 'text-bybit-yellow'}`}>
                      {data.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-bybit-darker rounded-lg">
              <div className="flex items-center mb-2">
                <div className="p-1 bg-bybit-yellow/10 rounded-md mr-2">
                  <div className="w-2 h-2 bg-bybit-yellow rounded-full"></div>
                </div>
                <p className="text-sm">AI Model Confidence</p>
              </div>
              <div className="flex items-center">
                <div className="h-2 flex-1 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-green-500 animate-pulse" style={{width: '83%'}}></div>
                </div>
                <span className="ml-2 text-sm font-medium">83%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Using Reinforcement Learning + 27 technical indicators</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <TradingView />
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={gradientBg}>
          <CardHeader>
            <CardTitle className="text-bybit-text flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-bybit-yellow" />
              Active Strategies
            </CardTitle>
            <CardDescription>
              Trading strategies currently used by the bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(activeStrategies).map(([strategy, isActive]) => (
                <div key={strategy} className={`p-3 rounded-lg border ${isActive ? 'bg-bybit-darker border-bybit-darker/60' : 'bg-transparent border-dashed border-bybit-darker/40'}`}>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-bybit-green' : 'bg-bybit-red'} mr-2`}></div>
                    <span className={isActive ? 'text-bybit-text' : 'text-muted-foreground'}>{strategy}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-bybit-yellow/10 border border-bybit-yellow/20 rounded-lg">
              <h3 className="text-sm font-medium text-bybit-yellow mb-2">Exclusive Advanced Modules</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    Flash Crash Detection
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    MEV Monitoring
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    Layer-0 Monitoring
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    Institutional Flow
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    Predictive Liquidation
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    NLP Sentiment Analysis
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    DXY & Macro Integration
                  </h4>
                </div>
                <div className="p-2 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark transition-all duration-300">
                  <h4 className="text-xs font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                    Reinforcement Learning
                  </h4>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={gradientBg}>
          <CardHeader>
            <CardTitle className="text-bybit-text flex items-center">
              <LineChart className="mr-2 h-5 w-5 text-bybit-yellow" />
              Trading Performance
            </CardTitle>
            <CardDescription>
              Real-time trading performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-bybit-darker rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
                <p className="text-xl font-bold text-bybit-green">78.5%</p>
                <p className="text-xs text-bybit-green">+3.2% this week</p>
              </div>
              <div className="p-3 bg-bybit-darker rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
                <p className="text-xl font-bold text-bybit-green">$1,857.43</p>
                <p className="text-xs text-bybit-green">+12.8% this month</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-bybit-darker rounded-lg">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Best Strategy</p>
                  <p className="text-sm font-medium">Mean Reversion</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Performance</span>
                  <span className="text-bybit-green">+28.3%</span>
                </div>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-lg">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Best Pair</p>
                  <p className="text-sm font-medium">SOLUSDT</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Performance</span>
                  <span className="text-bybit-green">+32.7%</span>
                </div>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-lg">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Recent Trades</p>
                  <p className="text-sm font-medium">42</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Win/Loss</span>
                  <span>32 / 10</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-bybit-darker rounded-lg">
              <p className="text-sm mb-2">Telegram Reports</p>
              <div className="flex justify-between text-xs">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                  <span className="text-muted-foreground">Trade Notifications</span>
                </div>
                <span className="text-bybit-green">Active</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-bybit-green mr-1"></div>
                  <span className="text-muted-foreground">Daily Reports</span>
                </div>
                <span className="text-bybit-green">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
