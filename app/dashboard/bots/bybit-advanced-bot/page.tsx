"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, BarChart3, ArrowUpDown, Terminal, Zap, Send, Clock, DollarSign, BarChart2 } from 'lucide-react';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';

export default function BybitAdvancedBotPage() {
  const { isAuthenticated } = useBybitAuth();
  const [isActivated, setIsActivated] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [tradeReports, setTradeReports] = useState(true);
  const [dailyReports, setDailyReports] = useState(true);
  const [macroUpdates, setMacroUpdates] = useState(true);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [activeStrategies, setActiveStrategies] = useState({
    meanReversion: true,
    emaCrossover: true,
    rsiDivergence: true,
    bollingerSqueeze: true,
    heikinAshi: false,
    supertrend: true,
    volumeSpike: false,
    adxTrend: true,
    fibonacciRetracement: false,
    vwap: true,
    priceAction: false,
    breakout: true
  });
  const [maxRiskPerTrade, setMaxRiskPerTrade] = useState(1);
  const [symbols, setSymbols] = useState({
    BTCUSDT: true,
    ETHUSDT: true,
    SOLUSDT: true,
    DOGEUSDT: false,
    XRPUSDT: false
  });
  const [timeframes, setTimeframes] = useState({
    '5m': true,
    '15m': true,
    '1h': true,
    '4h': true,
    '1d': false
  });
  
  const [botStats, setBotStats] = useState({
    totalTrades: 42,
    winningTrades: 32,
    losingTrades: 10,
    winRate: 76.2,
    totalProfit: 837.52,
    bestStrategy: 'Mean Reversion',
    bestPair: 'SOLUSDT',
    bestTimeframe: '1h'
  });
  
  const [selectedTab, setSelectedTab] = useState('configuration');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTelegramTesting, setIsTelegramTesting] = useState(false);
  
  useEffect(() => {
    // Simulation of loading data
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  const handleTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error('Please enter both Telegram token and chat ID');
      return;
    }
    
    setIsTelegramTesting(true);
    
    // Simulate API call to test Telegram connection
    setTimeout(() => {
      setIsTelegramTesting(false);
      setIsTelegramConnected(true);
      toast.success('Telegram connection successful!', {
        description: 'Bot will now send notifications to your Telegram.'
      });
    }, 1500);
  };
  
  const handleActivateBot = () => {
    if (!isAuthenticated) {
      toast.error('Please connect your Bybit account first');
      return;
    }
    
    if (!Object.values(symbols).some(v => v)) {
      toast.error('Please select at least one trading pair');
      return;
    }
    
    if (!Object.values(timeframes).some(v => v)) {
      toast.error('Please select at least one timeframe');
      return;
    }
    
    if (!Object.values(activeStrategies).some(v => v)) {
      toast.error('Please select at least one strategy');
      return;
    }
    
    setIsActivated(!isActivated);
    toast(isActivated ? 'Bot deactivated' : 'Bot activated', {
      description: isActivated 
        ? 'Your Bybit trading bot has been stopped' 
        : 'Your Bybit trading bot is now running with all selected settings',
      icon: isActivated ? <AlertTriangle className="h-5 w-5 text-yellow-500" /> : <CheckCircle2 className="h-5 w-5 text-green-500" />
    });
  };
  
  // Animated gradient background class
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border border-bybit-darker/60 shadow-lg`;
  
  const onOffClass = (isOn) => 
    isOn ? 'text-bybit-green font-medium' : 'text-muted-foreground';
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bybit-yellow"></div>
      </div>
    );
  }
  
  return (
    <div className="animate-in fade-in-50 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-bybit-text">Advanced Trading Bot</h1>
        <Button 
          onClick={handleActivateBot}
          className={`${isActivated ? 'bg-bybit-red hover:bg-bybit-red/80' : 'bg-bybit-green hover:bg-bybit-green/80'} text-white shadow-md transition-all duration-300 transform hover:-translate-y-1`}
        >
          {isActivated ? 'Deactivate Bot' : 'Activate Bot'}
        </Button>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4 bg-bybit-darker">
          <TabsTrigger 
            value="configuration" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Configuration
          </TabsTrigger>
          <TabsTrigger 
            value="strategies" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Trading Strategies
          </TabsTrigger>
          <TabsTrigger 
            value="telegram" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Telegram Setup
          </TabsTrigger>
          <TabsTrigger 
            value="advanced" 
            className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
          >
            Advanced Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-bybit-yellow" />
                  Trading Pairs
                </CardTitle>
                <CardDescription>
                  Select the cryptocurrency pairs to trade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(symbols).map(([symbol, isActive]) => (
                  <div key={symbol} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-bybit-yellow mr-2"></div>
                      <span>{symbol}</span>
                    </div>
                    <Switch 
                      checked={isActive} 
                      onCheckedChange={(checked) => setSymbols({...symbols, [symbol]: checked})} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-bybit-yellow" />
                  Timeframes
                </CardTitle>
                <CardDescription>
                  Select timeframes for analysis and trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(timeframes).map(([timeframe, isActive]) => (
                  <div key={timeframe} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-bybit-yellow mr-2"></div>
                      <span>{timeframe}</span>
                    </div>
                    <Switch 
                      checked={isActive} 
                      onCheckedChange={(checked) => setTimeframes({...timeframes, [timeframe]: checked})} 
                    />
                  </div>
                ))}
                <div className="pt-2 text-xs text-muted-foreground">
                  <AlertTriangle className="inline-block h-3 w-3 mr-1" />
                  Note: Trading restricted between 22:00-06:00 to reduce risk
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text flex items-center">
                <ArrowUpDown className="mr-2 h-5 w-5 text-bybit-yellow" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Configure risk parameters for safer trading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">Max Risk Per Trade: {maxRiskPerTrade}%</label>
                    <span className="text-xs text-bybit-green">Trading only with accumulated profit</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs">0.5%</span>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="5" 
                      step="0.5" 
                      value={maxRiskPerTrade} 
                      onChange={(e) => setMaxRiskPerTrade(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-bybit-darker rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="text-xs">5%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Stop Loss</span>
                      <span className="text-sm font-medium">Adaptive</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Automatically calculated based on asset volatility and support/resistance levels
                    </p>
                  </div>
                  
                  <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Take Profit</span>
                      <span className="text-sm font-medium">Multi-level</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Using trailing stops and taking partial profits at key resistance levels
                    </p>
                  </div>
                </div>
                
                <div className="p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex items-start">
                    <div className="bg-bybit-yellow/20 p-1 rounded-full mr-2 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-bybit-yellow" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Drawdown Protection</h4>
                      <p className="text-xs text-muted-foreground">
                        Bot will automatically pause trading if drawdown exceeds 10% of total equity or if
                        three consecutive losing trades occur with the same strategy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
            <h3 className="text-lg font-medium text-bybit-text mb-3">Bot Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Trading Status</div>
                <div className={`text-base font-medium ${isActivated ? 'text-bybit-green' : 'text-bybit-red'}`}>
                  {isActivated ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">API Connection</div>
                <div className="text-base font-medium text-bybit-green">
                  {isAuthenticated ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Telegram</div>
                <div className={`text-base font-medium ${isTelegramConnected ? 'text-bybit-green' : 'text-muted-foreground'}`}>
                  {isTelegramConnected ? 'Connected' : 'Not Setup'}
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Trading With</div>
                <div className="text-base font-medium text-bybit-green">
                  Accumulated Profit
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="strategies" className="space-y-6">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-bybit-yellow" />
                Technical Indicators
              </CardTitle>
              <CardDescription>
                Select the strategies and indicators to use for trading signals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(activeStrategies).map(([strategy, isActive]) => {
                  const formattedStrategy = strategy
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());
                  
                  return (
                    <div key={strategy} className="flex items-center justify-between p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-bybit-green' : 'bg-bybit-red'} mr-2`}></div>
                        <span>{formattedStrategy}</span>
                      </div>
                      <Switch 
                        checked={isActive} 
                        onCheckedChange={(checked) => setActiveStrategies({...activeStrategies, [strategy]: checked})} 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-bybit-yellow" />
                  AI-Enhanced Decision Making
                </CardTitle>
                <CardDescription>
                  How the bot combines multiple strategies for optimal decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <h4 className="font-medium mb-2">Reinforcement Learning</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    The bot learns from successful and unsuccessful trades to continuously optimize strategy weights
                  </p>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-bybit-yellow to-bybit-green animate-pulse" style={{width: '78%'}}></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Learning Progress</span>
                    <span>78%</span>
                  </div>
                </div>
                
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <h4 className="font-medium mb-2">Current Best Strategies</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Mean Reversion</span>
                      <span className="text-bybit-green text-sm">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">ADX Trend</span>
                      <span className="text-bybit-green text-sm">82%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">VWAP</span>
                      <span className="text-bybit-green text-sm">76%</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Adaptive Weight System</h4>
                    <div className="text-xs px-2 py-0.5 rounded-full bg-bybit-green/20 text-bybit-green">Active</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dynamically adjusts the influence of each strategy based on market conditions and performance
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text flex items-center">
                  <BarChart2 className="mr-2 h-5 w-5 text-bybit-yellow" />
                  Macroeconomic Integrations
                </CardTitle>
                <CardDescription>
                  External factors that affect trading decisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">DXY (US Dollar Index)</h4>
                    <span className="text-bybit-red">96.2 ▲</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Signal Impact</span>
                    <span className="text-bybit-red">Bearish for Crypto</span>
                  </div>
                </div>
                
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">Fear & Greed Index</h4>
                    <span className="text-bybit-yellow">42 (Fear)</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Signal Impact</span>
                    <span className="text-bybit-yellow">Neutral/Accumulate</span>
                  </div>
                </div>
                
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">Market Liquidity Analysis</h4>
                    <span className="text-bybit-green">High</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Signal Impact</span>
                    <span className="text-bybit-green">Favorable for Trading</span>
                  </div>
                </div>
                
                <div className="bg-bybit-darker p-3 rounded-lg border border-bybit-darker/60 shadow-inner">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">On-Chain Metrics</h4>
                    <span className="text-bybit-yellow">Neutral</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Signal Impact</span>
                    <span className="text-bybit-yellow">Wait for Confirmation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="p-4 bg-bybit-yellow/10 border border-bybit-yellow/20 rounded-lg">
            <h3 className="text-lg font-medium text-bybit-yellow mb-2">Exclusive Advanced Modules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  Flash Crash Prediction
                </h4>
                <p className="text-xs text-muted-foreground">
                  Monitors multiple indicators to predict and prepare for sudden market drops
                </p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  MEV Monitoring
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tracks front-running and sandwich attacks as early indicators of market volatility
                </p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  Layer-0 Monitoring
                </h4>
                <p className="text-xs text-muted-foreground">
                  Detects cross-chain activity before Layer-1 confirmation for ultra-early signals
                </p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  Institutional Flow Detection
                </h4>
                <p className="text-xs text-muted-foreground">
                  Identifies movements of "smart money" and large institutional players
                </p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  Predictive Liquidation Analysis
                </h4>
                <p className="text-xs text-muted-foreground">
                  Forecasts liquidation cascades before they occur to avoid or capitalize on price movements
                </p>
              </div>
              
              <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                <h4 className="font-medium flex items-center mb-1">
                  <div className="w-2 h-2 rounded-full bg-bybit-green mr-2"></div>
                  NLP Sentiment Analysis
                </h4>
                <p className="text-xs text-muted-foreground">
                  Processes news, social media, and forum discussions to gauge market sentiment in real-time
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="telegram" className="space-y-6">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text flex items-center">
                <Send className="mr-2 h-5 w-5 text-bybit-yellow" />
                Telegram Connection
              </CardTitle>
              <CardDescription>
                Set up your Telegram bot to receive notifications and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Telegram Bot Token</label>
                <Input 
                  placeholder="e.g. 1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ" 
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className="bg-bybit-darker text-bybit-text"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create a bot via BotFather (@BotFather) on Telegram to get your token
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Telegram Chat ID</label>
                <Input 
                  placeholder="e.g. 123456789" 
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  className="bg-bybit-darker text-bybit-text"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Send a message to @userinfobot on Telegram to get your Chat ID
                </p>
              </div>
              
              <Button 
                onClick={handleTestTelegram} 
                disabled={!telegramToken || !telegramChatId || isTelegramTesting}
                className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
              >
                {isTelegramTesting ? 'Testing Connection...' : 'Test Telegram Connection'}
              </Button>
              
              {isTelegramConnected && (
                <div className="p-3 bg-bybit-green/10 border border-bybit-green/30 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-bybit-green mr-2" />
                    <span className="text-bybit-green font-medium">Successfully connected to Telegram!</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your bot will now send notifications to your Telegram account
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text flex items-center">
                <Terminal className="mr-2 h-5 w-5 text-bybit-yellow" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure what information gets sent to your Telegram
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Trade Reports</h4>
                    <p className="text-xs text-muted-foreground">Notification for each executed trade</p>
                  </div>
                  <Switch checked={tradeReports} onCheckedChange={setTradeReports} />
                </div>
                
                <Separator className="bg-bybit-darker/60" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Daily Summary</h4>
                    <p className="text-xs text-muted-foreground">End-of-day report with performance metrics</p>
                  </div>
                  <Switch checked={dailyReports} onCheckedChange={setDailyReports} />
                </div>
                
                <Separator className="bg-bybit-darker/60" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Macro Updates</h4>
                    <p className="text-xs text-muted-foreground">Significant changes in macroeconomic factors</p>
                  </div>
                  <Switch checked={macroUpdates} onCheckedChange={setMacroUpdates} />
                </div>
                
                <div className="mt-4 p-3 bg-bybit-darker rounded-md">
                  <h4 className="text-sm font-medium mb-2">Example Notification</h4>
                  <div className="bg-bybit-dark p-3 rounded-md border border-bybit-darker/60 text-sm">
                    <div className="text-bybit-green font-medium mb-1">🟢 Trade Executed: BUY</div>
                    <div className="space-y-1 text-xs">
                      <div>🤖 Strategy: Mean Reversion + ADX</div>
                      <div>📊 Signal Strength: 82.5%</div>
                      <div>💰 Entry: $37,250.50</div>
                      <div>💼 Position Size: 0.025 BTC</div>
                      <div>🔄 Exit Target: $39,100.00</div>
                      <div className="text-xs text-muted-foreground mt-1">May 27, 2025 15:42:31</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Performance Metrics</CardTitle>
                <CardDescription>
                  Current bot statistics and performance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Total Trades</div>
                        <div className="text-xl font-bold">{botStats.totalTrades}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Win Rate</div>
                        <div className="text-xl font-bold text-bybit-green">{botStats.winRate}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Winning Trades</div>
                        <div className="text-xl font-bold text-bybit-green">{botStats.winningTrades}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Losing Trades</div>
                        <div className="text-xl font-bold text-bybit-red">{botStats.losingTrades}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Total Profit</span>
                      <span className="text-xl font-bold text-bybit-green">${botStats.totalProfit}</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-bybit-yellow to-bybit-green" style={{width: '78%'}}></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-bybit-darker rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Best Strategy</div>
                      <div className="text-sm font-medium truncate">{botStats.bestStrategy}</div>
                    </div>
                    <div className="p-2 bg-bybit-darker rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Best Pair</div>
                      <div className="text-sm font-medium">{botStats.bestPair}</div>
                    </div>
                    <div className="p-2 bg-bybit-darker rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Best Timeframe</div>
                      <div className="text-sm font-medium">{botStats.bestTimeframe}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Advanced Features</CardTitle>
                <CardDescription>
                  Enable or disable specialized trading features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                    <div>
                      <h4 className="font-medium">Monte Carlo Simulation</h4>
                      <p className="text-xs text-muted-foreground">Run 10,000 simulations to optimize parameters</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                    <div>
                      <h4 className="font-medium">Correlation Analysis</h4>
                      <p className="text-xs text-muted-foreground">Track correlations between assets for diversification</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                    <div>
                      <h4 className="font-medium">Trading Journal</h4>
                      <p className="text-xs text-muted-foreground">Automated trade logging with annotations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner hover:border-bybit-yellow/30 transition-all duration-300">
                    <div>
                      <h4 className="font-medium">Tax Reporting</h4>
                      <p className="text-xs text-muted-foreground">Generate tax-ready reports of trading activity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text">Bot Operation Schedule</CardTitle>
              <CardDescription>
                Configure when the bot will automatically trade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-bybit-darker rounded-lg">
                  <h4 className="font-medium mb-3">Trading Hours</h4>
                  <div className="grid grid-cols-12 gap-1">
                    {Array.from({length: 24}).map((_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      const isDisabled = i >= 22 || i < 6;
                      return (
                        <div 
                          key={hour} 
                          className={`h-8 flex items-center justify-center rounded ${isDisabled ? 'bg-bybit-red/20 text-bybit-red/60' : 'bg-bybit-green/20 text-bybit-green'}`}
                          title={isDisabled ? 'Trading disabled during this hour' : 'Trading enabled during this hour'}
                        >
                          {hour}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-bybit-green/20 rounded mr-1"></div>
                      <span>Trading enabled (06:00-22:00)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-bybit-red/20 rounded mr-1"></div>
                      <span>Trading disabled (22:00-06:00)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
                    <h4 className="font-medium mb-2">Trading Intervals</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">5-minute checks</span>
                        <span className={onOffClass(timeframes['5m'])}>Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">15-minute checks</span>
                        <span className={onOffClass(timeframes['15m'])}>Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">1-hour checks</span>
                        <span className={onOffClass(timeframes['1h'])}>Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">4-hour checks</span>
                        <span className={onOffClass(timeframes['4h'])}>Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Daily checks</span>
                        <span className={onOffClass(timeframes['1d'])}>Inactive</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-bybit-darker rounded-lg border border-bybit-darker/60 shadow-inner">
                    <h4 className="font-medium mb-2">Trading Pairs</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(symbols).map(([symbol, isActive]) => (
                        <div key={symbol} className="flex justify-between">
                          <span className="text-sm">{symbol}</span>
                          <span className={onOffClass(isActive)}>{isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}