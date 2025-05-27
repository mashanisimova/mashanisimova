"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Badge } from '@/components/ui/badge'
import { Dices, Wallet, BarChart3, Zap, ArrowRightLeft, PanelLeftClose, Info } from 'lucide-react'
import { AIDecisionPanel } from '@/components/ui-custom/ai-decision-panel'

// Mock data for multi-exchange arbitrage opportunities
const arbitrageOpportunities = [
  { 
    id: 'arb1',
    symbol: 'BTC-USDT', 
    buyExchange: 'Bybit', 
    sellExchange: 'Binance', 
    priceDiff: 0.15, 
    diffPercent: 0.32,
    estimatedProfit: 12.50,
    volume24h: 1250000,
    lastUpdated: '2 mins ago',
    status: 'active'
  },
  { 
    id: 'arb2',
    symbol: 'ETH-USDT', 
    buyExchange: 'Coinbase', 
    sellExchange: 'Bybit', 
    priceDiff: 0.85, 
    diffPercent: 0.28,
    estimatedProfit: 8.20,
    volume24h: 980000,
    lastUpdated: '1 min ago',
    status: 'active'
  },
  { 
    id: 'arb3',
    symbol: 'SOL-USDT', 
    buyExchange: 'Binance', 
    sellExchange: 'Coinbase', 
    priceDiff: 0.04, 
    diffPercent: 0.17,
    estimatedProfit: 3.80,
    volume24h: 560000,
    lastUpdated: '5 mins ago',
    status: 'active'
  },
]

// Mock AI prediction data
const mockPrediction = {
  direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
  confidence: 78,
  timeframe: '1h',
  signals: [
    {
      name: 'EMA Crossover',
      value: 1.25,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      weight: 0.8,
      explanation: 'The 50 EMA crossed above the 200 EMA, indicating a bullish trend change.'
    },
    {
      name: 'RSI',
      value: 0.95,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      weight: 0.6,
      explanation: 'RSI bounced from oversold conditions, showing strength.'
    },
    {
      name: 'Volume Profile',
      value: 0.75,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      weight: 0.7,
      explanation: 'Higher than average buying volume supporting price action.'
    },
    {
      name: 'Support Level',
      value: 0.85,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      weight: 0.5,
      explanation: 'Price successfully tested and bounced from major support.'
    },
    {
      name: 'Bollinger Bands',
      value: 0.65,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      weight: 0.4,
      explanation: 'Price broke above the upper Bollinger Band with increasing volatility.'
    },
  ],
  macroFactors: [
    {
      name: 'DXY (Dollar Index)',
      impact: -0.8,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      description: 'DXY is showing weakness, which historically correlates with stronger crypto prices.'
    },
    {
      name: 'Market Sentiment',
      impact: 0.9,
      direction: 'bullish' as 'bullish' | 'bearish' | 'neutral',
      description: 'Fear & Greed Index moving from Fear to Neutral, indicating improving sentiment.'
    },
    {
      name: 'BTC Dominance',
      impact: 0.3,
      direction: 'neutral' as 'bullish' | 'bearish' | 'neutral',
      description: 'BTC dominance stable, indicating a balanced market.'
    }
  ],
  reasoning: [
    'Technical indicators show strong bullish momentum across multiple timeframes',
    'Exchange inflows decreasing, suggesting less selling pressure',
    'Increased institutional interest based on derivatives open interest',
    'Market structure has formed higher lows, indicating trend reversal',
    'Reduced correlation with traditional markets creates favorable conditions'
  ]
}

// Mock exchange balance data
const exchangeBalances = {
  Bybit: {
    USDT: 5000.25,
    BTC: 0.15,
    ETH: 2.5,
    SOL: 25.0
  },
  Binance: {
    USDT: 7500.50,
    BTC: 0.08,
    ETH: 1.2,
    SOL: 15.0
  },
  Coinbase: {
    USDT: 3200.75,
    BTC: 0.05,
    ETH: 0.8,
    SOL: 10.0
  }
}

export default function MultiExchangePage() {
  const { toast } = useToast()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USDT')
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  
  const handleArbitrageExecute = (arbId: string) => {
    toast({
      title: "Arbitrage Initiated",
      description: "Starting cross-exchange arbitrage execution...",
    })
  }
  
  const handleTimeframeChange = (timeframe: string) => {
    toast({
      title: "Timeframe Changed",
      description: `Analysis updated to ${timeframe} timeframe`,
    })
  }
  
  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Multi-Exchange Trading</h2>
          <div className="flex items-center gap-2">
            <Select defaultValue="all" onValueChange={(value) => {}}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Exchange Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exchanges</SelectItem>
                <SelectItem value="bybit">Bybit</SelectItem>
                <SelectItem value="binance">Binance</SelectItem>
                <SelectItem value="coinbase">Coinbase</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <PanelLeftClose className={`h-4 w-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="arbitrage" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="arbitrage">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Arbitrage
            </TabsTrigger>
            <TabsTrigger value="cross">
              <Zap className="h-4 w-4 mr-2" />
              Cross-Exchange
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="arbitrage" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {arbitrageOpportunities.map((arb) => (
                <Card key={arb.id} className="border-gray-800 bg-black/40 backdrop-blur-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>{arb.symbol}</CardTitle>
                        <CardDescription>
                          Buy on {arb.buyExchange}, Sell on {arb.sellExchange}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
                        +{arb.diffPercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Price Difference</span>
                        <span>${arb.priceDiff}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Profit (1 unit)</span>
                        <span className="text-green-400">${arb.estimatedProfit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">24h Volume</span>
                        <span>${(arb.volume24h / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{arb.lastUpdated}</span>
                      </div>
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-bybit-yellow to-amber-500 text-black hover:from-bybit-yellow/90 hover:to-amber-500/90" 
                          onClick={() => handleArbitrageExecute(arb.id)}
                        >
                          Execute Arbitrage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="cross">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-gray-800 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Cross-Exchange Strategy Builder</CardTitle>
                  <CardDescription>
                    Create custom strategies across multiple exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Buy Exchange</label>
                        <Select defaultValue="bybit">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bybit">Bybit</SelectItem>
                            <SelectItem value="binance">Binance</SelectItem>
                            <SelectItem value="coinbase">Coinbase</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">Sell Exchange</label>
                        <Select defaultValue="binance">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bybit">Bybit</SelectItem>
                            <SelectItem value="binance">Binance</SelectItem>
                            <SelectItem value="coinbase">Coinbase</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Trading Pair</label>
                      <Select defaultValue="btc-usdt">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="btc-usdt">BTC-USDT</SelectItem>
                          <SelectItem value="eth-usdt">ETH-USDT</SelectItem>
                          <SelectItem value="sol-usdt">SOL-USDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Strategy Type</label>
                      <Select defaultValue="manual">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="auto">Automated</SelectItem>
                          <SelectItem value="threshold">Threshold-based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full">
                      Create Strategy
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-800 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Market Conditions</CardTitle>
                  <CardDescription>
                    Current market conditions across exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <Card className="border-gray-800 bg-black/20">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Bybit BTC</div>
                          <div className="text-xl font-bold">$40,521</div>
                          <div className="text-xs text-green-400">+0.8%</div>
                        </CardContent>
                      </Card>
                      <Card className="border-gray-800 bg-black/20">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Binance BTC</div>
                          <div className="text-xl font-bold">$40,582</div>
                          <div className="text-xs text-green-400">+0.9%</div>
                        </CardContent>
                      </Card>
                      <Card className="border-gray-800 bg-black/20">
                        <CardContent className="p-3">
                          <div className="text-xs text-muted-foreground">Coinbase BTC</div>
                          <div className="text-xl font-bold">$40,490</div>
                          <div className="text-xs text-green-400">+0.7%</div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">BTC-USDT Spreads</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bybit vs Binance</span>
                        <span className="text-red-400">-$61.00 (-0.15%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bybit vs Coinbase</span>
                        <span className="text-green-400">+$31.00 (+0.08%)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Binance vs Coinbase</span>
                        <span className="text-green-400">+$92.00 (+0.23%)</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" className="w-full">
                        <Dices className="h-4 w-4 mr-2" />
                        Run Arbitrage Scanner
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-gray-800 bg-black/40 backdrop-blur-sm col-span-2">
                <CardHeader>
                  <CardTitle>Cross-Exchange Liquidity Map</CardTitle>
                  <CardDescription>
                    Visualize liquidity across all connected exchanges
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <div className="text-muted-foreground flex flex-col items-center">
                    <BarChart3 className="h-10 w-10 mb-2" />
                    <span>Liquidity visualization would appear here</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-800 bg-black/40 backdrop-blur-sm row-span-2">
                <CardHeader>
                  <CardTitle>Exchange Performance</CardTitle>
                  <CardDescription>
                    Latency and reliability metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Bybit</div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">API Latency</span>
                        <span>125ms</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Binance</div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">API Latency</span>
                        <span>98ms</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Coinbase</div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">API Latency</span>
                        <span>210ms</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <div className="text-sm font-medium mb-2">Order Success Rate (24h)</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-black/20 rounded-md">
                          <span className="text-xs text-muted-foreground">Bybit</span>
                          <span className="text-lg font-bold">99.8%</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-black/20 rounded-md">
                          <span className="text-xs text-muted-foreground">Binance</span>
                          <span className="text-lg font-bold">99.9%</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-black/20 rounded-md">
                          <span className="text-xs text-muted-foreground">Coinbase</span>
                          <span className="text-lg font-bold">98.7%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-gray-800 bg-black/40 backdrop-blur-sm col-span-2">
                <CardHeader>
                  <CardTitle>Trading Performance</CardTitle>
                  <CardDescription>
                    Cross-exchange trading results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card className="border-gray-800 bg-black/20">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Total Profit</div>
                        <div className="text-xl font-bold">$3,842.50</div>
                        <div className="text-xs text-green-400">+12.8% ROI</div>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-800 bg-black/20">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Arbitrage Trades</div>
                        <div className="text-xl font-bold">128</div>
                        <div className="text-xs text-muted-foreground">Last 30 days</div>
                      </CardContent>
                    </Card>
                    <Card className="border-gray-800 bg-black/20">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                        <div className="text-xl font-bold">94.5%</div>
                        <div className="text-xs text-muted-foreground">7 failed trades</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="text-sm font-medium mb-2">Top Performing Pairs</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-black/20 rounded-md">
                      <div>
                        <span className="font-medium">BTC-USDT</span>
                        <span className="text-xs text-muted-foreground ml-2">Bybit → Binance</span>
                      </div>
                      <div className="text-green-400 font-medium">+$1,245.80</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-black/20 rounded-md">
                      <div>
                        <span className="font-medium">ETH-USDT</span>
                        <span className="text-xs text-muted-foreground ml-2">Coinbase → Bybit</span>
                      </div>
                      <div className="text-green-400 font-medium">+$982.35</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-black/20 rounded-md">
                      <div>
                        <span className="font-medium">SOL-USDT</span>
                        <span className="text-xs text-muted-foreground ml-2">Binance → Coinbase</span>
                      </div>
                      <div className="text-green-400 font-medium">+$754.60</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-full md:w-96 border-l border-gray-800 bg-gradient-to-b from-black to-gray-900/90 overflow-auto p-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-bybit-yellow" />
              Exchange Balances
            </h3>
            <p className="text-sm text-muted-foreground">Connected exchange accounts</p>
          </div>
          
          <div className="space-y-3 mb-6">
            {Object.entries(exchangeBalances).map(([exchange, balances]) => (
              <Card key={exchange} className="border-gray-800 bg-black/20">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex justify-between items-center">
                    {exchange}
                    <Badge variant="outline" className="text-xs font-normal">
                      Connected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="space-y-1">
                    {Object.entries(balances).map(([asset, amount]) => (
                      <div key={asset} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{asset}</span>
                        <span>{asset === 'USDT' ? `$${amount.toFixed(2)}` : amount.toFixed(asset === 'BTC' ? 8 : 4)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium flex items-center">
              <Info className="h-5 w-5 mr-2 text-bybit-yellow" />
              Analysis
            </h3>
            <p className="text-sm text-muted-foreground">Market analysis and AI predictions</p>
          </div>
          
          <AIDecisionPanel 
            symbol={selectedSymbol} 
            prediction={mockPrediction} 
            onTimeframeChange={handleTimeframeChange}
          />
        </div>
      )}
    </div>
  )
}
