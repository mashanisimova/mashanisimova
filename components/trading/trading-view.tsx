'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, BarChart, Zap, LineChart, Settings, MoonStar, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

export function TradingView() {
  const { isAuthenticated } = useBybitAuth();
  const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');
  const [isLoaded, setIsLoaded] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Animation effect for loaded state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];
  
  // Animated gradient background class
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border border-bybit-darker/60 shadow-lg`;
  
  return (
    <div className={`transition-all duration-300 ease-in-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      {/* Theme Toggle */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full w-10 h-10 p-0"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
        </Button>
      </div>
      
      <Tabs defaultValue="trading" className="w-full">
        <TabsList className="mb-4 bg-bybit-darker">
          <TabsTrigger value="trading" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
            Trading View
          </TabsTrigger>
          <TabsTrigger value="analysis" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
            Advanced Analysis
          </TabsTrigger>
          <TabsTrigger value="bot" className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black">
            Bot Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="trading" className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`bg-bybit-darker border border-bybit-darker/60 hover:bg-bybit-yellow hover:text-black transition-all duration-300 shadow-inner hover:shadow-md`}>
                  {activeSymbol} <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-bybit-darker border border-bybit-darker/60 shadow-lg">
                {symbols.map(symbol => (
                  <DropdownMenuItem 
                    key={symbol} 
                    onClick={() => setActiveSymbol(symbol)}
                    className="hover:bg-bybit-yellow hover:text-black cursor-pointer transition-colors duration-200"
                  >
                    {symbol}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-bybit-green text-bybit-green hover:bg-bybit-green hover:text-black transition-all duration-300 transform hover:scale-[1.05] shadow-md hover:shadow-bybit-green/30"
                disabled={!isAuthenticated}
              >
                Buy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="border-bybit-red text-bybit-red hover:bg-bybit-red hover:text-white transition-all duration-300 transform hover:scale-[1.05] shadow-md hover:shadow-bybit-red/30"
                disabled={!isAuthenticated}
              >
                Sell
              </Button>
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text flex items-center justify-between">
                    <span>Market Overview</span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <LineChart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <BarChart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Real-time trading view and market data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-bybit-darker rounded-md flex items-center justify-center overflow-hidden relative group border border-bybit-darker/60 shadow-inner">
                    {!isAuthenticated ? (
                      <div className="text-center p-6 bg-bybit-darker/80 rounded-lg border border-bybit-darker/60 backdrop-blur-sm transform transition-all duration-500 hover:scale-105">
                        <div className="mb-4">
                          <div className="inline-block bg-bybit-yellow/20 p-3 rounded-full">
                            <LineChart className="h-8 w-8 text-bybit-yellow" />
                          </div>
                        </div>
                        <p className="text-bybit-text mb-4">Connect your Bybit account to view real-time trading charts</p>
                        <div className="animate-pulse flex space-x-1 justify-center">
                          <div className="h-2 w-2 bg-bybit-yellow rounded-full"></div>
                          <div className="h-2 w-2 bg-bybit-yellow rounded-full delay-100"></div>
                          <div className="h-2 w-2 bg-bybit-yellow rounded-full delay-200"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-bybit-darker/50 backdrop-blur-sm flex items-center justify-center text-bybit-text z-10">
                        <div className="text-center bg-bybit-darker/80 p-6 rounded-lg border border-bybit-darker/60 shadow-lg">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-bybit-yellow">
                              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <div className="h-8 w-8 rounded-full bg-bybit-yellow/20"></div>
                              </div>
                            </div>
                          </div>
                          <p className="mt-4">Loading chart data for <span className="text-bybit-yellow font-semibold">{activeSymbol}</span></p>
                          <p className="text-xs text-bybit-text/70 mt-2">Please wait while we fetch the latest market data</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {isAuthenticated && (
                <Card className={gradientBg}>
                  <CardHeader>
                    <CardTitle className="text-bybit-text">Advanced Indicators</CardTitle>
                    <CardDescription>
                      AI-powered trading signals and analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker/60 shadow-inner group hover:border-bybit-yellow/30 transition-all duration-300 transform hover:translate-y-[-2px]">
                        <div className="flex items-center mb-2">
                          <div className="p-1 bg-bybit-yellow/10 rounded-md mr-2">
                            <div className="w-2 h-2 bg-bybit-yellow rounded-full"></div>
                          </div>
                          <div className="text-sm text-muted-foreground">AI Confidence</div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-500 to-green-500 group-hover:animate-pulse" style={{width: '78%'}}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium">78%</span>
                        </div>
                      </div>
                      
                      <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker/60 shadow-inner group hover:border-bybit-green/30 transition-all duration-300 transform hover:translate-y-[-2px]">
                        <div className="flex items-center mb-2">
                          <div className="p-1 bg-bybit-green/10 rounded-md mr-2">
                            <div className="w-2 h-2 bg-bybit-green rounded-full"></div>
                          </div>
                          <div className="text-sm text-muted-foreground">Signal Strength</div>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 flex-1 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-bybit-green group-hover:animate-pulse" style={{width: '85%'}}></div>
                          </div>
                          <span className="ml-2 text-sm font-medium text-bybit-green">BUY</span>
                        </div>
                      </div>
                      
                      <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker/60 shadow-inner group hover:border-bybit-yellow/30 transition-all duration-300 transform hover:translate-y-[-2px]">
                        <div className="flex items-center mb-2">
                          <div className="p-1 bg-bybit-green/10 rounded-md mr-2">
                            <div className="w-2 h-2 bg-bybit-green rounded-full"></div>
                          </div>
                          <div className="text-sm text-muted-foreground">Predicted Move</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-bybit-green font-semibold">+2.5%</div>
                            <div className="ml-1 text-xs py-0.5 px-1 rounded bg-bybit-green/10 text-bybit-green">High Confidence</div>
                          </div>
                          <span className="text-xs text-muted-foreground">(24h)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <AuthForm />
              
              {isAuthenticated && (
                <Card className={gradientBg}>
                  <CardHeader>
                    <CardTitle className="text-bybit-text">Bot Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Automated Trading</span>
                      <Switch id="autoTrading" checked={false} onCheckedChange={(checked) => {
                        if (checked) {
                          toast.success('Automated trading activated', {
                            description: 'Bot will now trade automatically based on signals'
                          });
                          console.log('Starting automated trading with:');
                          console.log('- Trading pairs: BTCUSDT, ETHUSDT, SOLUSDT');
                          console.log('- Timeframes: 5m, 15m, 1h, 4h');
                          console.log('- Active strategies: Mean Reversion, EMA Crossover, RSI Divergence, etc.');
                          console.log('- Trading only with accumulated profit');
                          console.log('- Trading restricted between 22:00-06:00');
                        } else {
                          toast.info('Automated trading deactivated');
                        }
                      }} />
                    </div>
                    
                    <div className="p-3 bg-bybit-darker rounded-md border border-bybit-darker/60 shadow-inner">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Bot Performance</span>
                        <span className="text-bybit-green">+12.5%</span>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-bybit-yellow to-bybit-green" style={{width: '72%'}}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-bybit-darker p-2 rounded-md text-center border border-bybit-darker/60 shadow-inner">
                        <div className="text-2xl font-bold text-bybit-green">8</div>
                        <div className="text-xs text-muted-foreground">Winning Trades</div>
                      </div>
                      <div className="bg-bybit-darker p-2 rounded-md text-center border border-bybit-darker/60 shadow-inner">
                        <div className="text-2xl font-bold text-bybit-red">2</div>
                        <div className="text-xs text-muted-foreground">Losing Trades</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-bybit-darker border border-bybit-darker/60 hover:bg-bybit-yellow hover:text-black group transition-all duration-300 shadow-inner hover:shadow-bybit-yellow/20 relative overflow-hidden"
                    disabled={!isAuthenticated}
                    onClick={() => {
                      toast.success('Automated trading activated', {
                        description: 'Bot will now trade automatically based on signals'
                      });
                      console.log('Starting automated trading with:');
                      console.log('- Trading pairs: BTCUSDT, ETHUSDT, SOLUSDT');
                      console.log('- Timeframes: 5m, 15m, 1h, 4h');
                      console.log('- Active strategies: Mean Reversion, EMA Crossover, RSI Divergence, etc.');
                      console.log('- Trading only with accumulated profit');
                      console.log('- Trading restricted between 22:00-06:00');
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-bybit-yellow/0 via-bybit-yellow/10 to-bybit-yellow/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="bg-bybit-yellow/20 p-1 rounded-full mr-2">
                      <Zap className="h-4 w-4 text-bybit-yellow group-hover:text-black group-hover:scale-110 transition-all" />
                    </div>
                    Start Automated Trading
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-bybit-darker border border-bybit-darker/60 hover:bg-bybit-yellow hover:text-black group transition-all duration-300 shadow-inner hover:shadow-bybit-yellow/20 relative overflow-hidden"
                    disabled={!isAuthenticated}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-bybit-yellow/0 via-bybit-yellow/10 to-bybit-yellow/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="bg-bybit-yellow/20 p-1 rounded-full mr-2">
                      <BarChart className="h-4 w-4 text-bybit-yellow group-hover:text-black group-hover:scale-110 transition-all" />
                    </div>
                    Run Backtesting
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-bybit-darker border border-bybit-darker/60 hover:bg-bybit-yellow hover:text-black group transition-all duration-300 shadow-inner hover:shadow-bybit-yellow/20 relative overflow-hidden"
                    disabled={!isAuthenticated}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-bybit-yellow/0 via-bybit-yellow/10 to-bybit-yellow/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="bg-bybit-yellow/20 p-1 rounded-full mr-2">
                      <LineChart className="h-4 w-4 text-bybit-yellow group-hover:text-black group-hover:scale-110 transition-all" />
                    </div>
                    View Trading Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="animate-in fade-in-50 duration-300">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text">Advanced Market Analysis</CardTitle>
              <CardDescription>
                AI-powered market insights and predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-bybit-text mb-4">Connect your Bybit account to access advanced analysis features</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bot" className="animate-in fade-in-50 duration-300">
          <Card className={gradientBg}>
            <CardHeader>
              <CardTitle className="text-bybit-text">Trading Bot Configuration</CardTitle>
              <CardDescription>
                Configure your automated trading strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-bybit-text mb-4">Connect your Bybit account to access bot configuration</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AuthForm() {
  const { connectToBybit, isAuthenticated, isTestnet, disconnect } = useBybitAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [useTestnet, setUseTestnet] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await connectToBybit({
        apiKey,
        apiSecret,
        testnet: useTestnet,
      });
      
      if (success) {
        toast.success('Successfully connected to Bybit');
        // Clear form
        setApiKey('');
        setApiSecret('');
      } else {
        toast.error('Failed to connect to Bybit');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error connecting to Bybit');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <Card className="w-full bg-bybit-dark border-bybit-darker">
        <CardHeader>
          <CardTitle className="text-bybit-text">Connected to Bybit</CardTitle>
          <CardDescription>
            You are currently connected to {isTestnet ? 'Bybit Testnet' : 'Bybit Mainnet'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            onClick={() => {
              disconnect();
              toast.success('Disconnected from Bybit');
            }} 
            variant="destructive" 
            className="w-full bg-bybit-red/20 text-bybit-red hover:bg-bybit-red hover:text-white"
          >
            Disconnect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-bybit-dark border-bybit-darker">
      <CardHeader>
        <CardTitle className="text-bybit-text">Connect to Bybit</CardTitle>
        <CardDescription>
          Enter your API key and secret to connect to Bybit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="bg-bybit-darker text-bybit-text"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="bg-bybit-darker text-bybit-text"
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="testnet"
              checked={useTestnet}
              onCheckedChange={setUseTestnet}
            />
            <Label htmlFor="testnet">Use Testnet</Label>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-bybit-yellow text-black hover:bg-bybit-yellow/80"
          >
            {isSubmitting ? 'Connecting...' : 'Connect'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Your API keys are stored locally in your browser and are never sent to our servers.
        </p>
      </CardFooter>
    </Card>
  );
}
