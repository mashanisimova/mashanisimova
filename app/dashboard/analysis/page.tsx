'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileDown, AlertTriangle, ArrowUpRight, BarChart2, PieChart, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

// Mock data for initial render
const mockPerformanceData = [
  { date: '2025-05-20', pnl: 120.5, winRate: 75, totalTrades: 8 },
  { date: '2025-05-21', pnl: -45.2, winRate: 40, totalTrades: 5 },
  { date: '2025-05-22', pnl: 85.3, winRate: 67, totalTrades: 6 },
  { date: '2025-05-23', pnl: 190.7, winRate: 80, totalTrades: 10 },
  { date: '2025-05-24', pnl: -20.8, winRate: 50, totalTrades: 4 },
  { date: '2025-05-25', pnl: 210.5, winRate: 85, totalTrades: 7 },
  { date: '2025-05-26', pnl: 105.2, winRate: 70, totalTrades: 10 },
];

const mockStrategyPerformance = [
  { name: 'MeanReversion', winRate: 78, trades: 25, pnl: 325.5, sharpe: 2.4 },
  { name: 'EMA Crossover', winRate: 65, trades: 32, pnl: 210.8, sharpe: 1.8 },
  { name: 'RSI Divergence', winRate: 72, trades: 18, pnl: 280.2, sharpe: 2.1 },
  { name: 'Bollinger Squeeze', winRate: 68, trades: 22, pnl: 195.5, sharpe: 1.9 },
  { name: 'Volume Spike', winRate: 60, trades: 15, pnl: 120.3, sharpe: 1.5 },
  { name: 'ADX Trend', winRate: 74, trades: 27, pnl: 315.7, sharpe: 2.2 },
  { name: 'Supertrend', winRate: 70, trades: 30, pnl: 260.1, sharpe: 2.0 },
];

const mockRiskMetrics = {
  valueAtRisk: {
    daily95: 120.5,
    daily99: 180.8,
    weekly95: 320.2
  },
  portfolioVolatility: 4.2,
  sharpeRatio: 1.8,
  maxDrawdown: 12.5,
  concentrationRisk: {
    topPosition: 'BTCUSDT',
    topPositionPct: 35.2,
    diversificationScore: 0.68
  },
  correlationRisk: {
    highestPair: ['BTCUSDT', 'ETHUSDT'],
    highestValue: 0.78,
    avgCorrelation: 0.52
  },
  overallRiskLevel: 'Medium',
  recommendations: [
    'Consider reducing BTCUSDT exposure below 30%',
    'Add uncorrelated assets to improve diversification',
    'Current Sharpe ratio is good but can be improved'
  ]
};

const mockMonteCarlo = [
  { month: 1, optimistic: 12500, expected: 11200, pessimistic: 9800 },
  { month: 2, optimistic: 14200, expected: 12400, pessimistic: 10100 },
  { month: 3, optimistic: 16100, expected: 13700, pessimistic: 10300 },
  { month: 4, optimistic: 18400, expected: 15200, pessimistic: 10500 },
  { month: 5, optimistic: 21000, expected: 16800, pessimistic: 10600 },
  { month: 6, optimistic: 24000, expected: 18500, pessimistic: 10700 },
];

export default function AnalysisPage() {
  const { isAuthenticated } = useBybitAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState('1W');
  const [activeTab, setActiveTab] = useState('performance');
  
  // Animation effect for loaded state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Animated gradient background class
  const gradientBg = `bg-gradient-to-br from-bybit-dark to-bybit-darker relative overflow-hidden
    before:absolute before:inset-0 before:bg-gradient-to-br before:from-bybit-yellow/10 before:to-transparent before:opacity-0
    hover:before:opacity-100 before:transition-opacity before:duration-700 border border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300`;

  return (
    <div className={`transition-all duration-300 ease-in-out transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Advanced Analytics</h1>
        <div className="flex space-x-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button variant="outline" size="sm" className="border-bybit-darker hover:bg-bybit-yellow hover:text-black">
            <FileDown className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="border-bybit-darker hover:bg-bybit-yellow hover:text-black">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {!isAuthenticated ? (
        <Card className={gradientBg}>
          <CardHeader>
            <CardTitle className="text-bybit-text flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-bybit-yellow" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please connect your Bybit account to access detailed performance analytics and insights.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-bybit-darker">
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
            >
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="strategies" 
              className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
            >
              Strategy Analysis
            </TabsTrigger>
            <TabsTrigger 
              value="risk" 
              className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
            >
              Risk Management
            </TabsTrigger>
            <TabsTrigger 
              value="montecarlo" 
              className="data-[state=active]:bg-bybit-yellow data-[state=active]:text-black"
            >
              Monte Carlo
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PerformanceCard 
                title="Total Profit/Loss"
                value="+$648.2"
                change="+5.2%"
                positive={true}
                icon={<ArrowUpRight className="h-4 w-4" />}
              />
              <PerformanceCard 
                title="Win Rate"
                value="72%"
                change="+8%"
                positive={true}
                icon={<BarChart2 className="h-4 w-4" />}
              />
              <PerformanceCard 
                title="Total Trades"
                value="68"
                change="-4"
                positive={false}
                icon={<RefreshCw className="h-4 w-4" />}
              />
            </div>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Profit/Loss Over Time</CardTitle>
                <CardDescription>
                  Daily P&L for the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockPerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <Line 
                        type="monotone" 
                        dataKey="pnl" 
                        stroke="#F0B90B" 
                        strokeWidth={2} 
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <CartesianGrid stroke="#1E2329" strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#E6E8EA" 
                        tickFormatter={(value) => value.split('-')[2]} // Just show day
                      />
                      <YAxis stroke="#E6E8EA" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0B0E11', 
                          borderColor: '#1E2329',
                          color: '#E6E8EA'
                        }}
                        labelStyle={{ color: '#E6E8EA' }}
                        itemStyle={{ color: '#F0B90B' }}
                        formatter={(value) => [`$${value}`, 'P&L']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Win Rate Trend</CardTitle>
                  <CardDescription>
                    Win rate percentage over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[250px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockPerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Line 
                          type="monotone" 
                          dataKey="winRate" 
                          stroke="#1BD19D" 
                          strokeWidth={2} 
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6, strokeWidth: 2 }}
                        />
                        <CartesianGrid stroke="#1E2329" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#E6E8EA" 
                          tickFormatter={(value) => value.split('-')[2]} // Just show day
                        />
                        <YAxis stroke="#E6E8EA" domain={[0, 100]} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0B0E11', 
                            borderColor: '#1E2329',
                            color: '#E6E8EA'
                          }}
                          labelStyle={{ color: '#E6E8EA' }}
                          itemStyle={{ color: '#1BD19D' }}
                          formatter={(value) => [`${value}%`, 'Win Rate']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Trading Volume</CardTitle>
                  <CardDescription>
                    Number of trades executed daily
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[250px] w-full p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockPerformanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <Bar 
                          dataKey="totalTrades" 
                          fill="#F0B90B" 
                          radius={[4, 4, 0, 0]}
                        />
                        <CartesianGrid stroke="#1E2329" strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#E6E8EA" 
                          tickFormatter={(value) => value.split('-')[2]} // Just show day
                        />
                        <YAxis stroke="#E6E8EA" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0B0E11', 
                            borderColor: '#1E2329',
                            color: '#E6E8EA'
                          }}
                          labelStyle={{ color: '#E6E8EA' }}
                          itemStyle={{ color: '#F0B90B' }}
                          formatter={(value) => [value, 'Trades']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="strategies" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Strategy Performance Comparison</CardTitle>
                <CardDescription>
                  Comparing key metrics across different trading strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={mockStrategyPerformance} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      barSize={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" />
                      <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} stroke="#E6E8EA" />
                      <YAxis yAxisId="left" orientation="left" stroke="#1BD19D" />
                      <YAxis yAxisId="right" orientation="right" stroke="#F0B90B" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0B0E11', 
                          borderColor: '#1E2329',
                          color: '#E6E8EA'
                        }}
                        labelStyle={{ color: '#E6E8EA' }}
                      />
                      <Bar yAxisId="left" dataKey="winRate" fill="#1BD19D" name="Win Rate (%)" />
                      <Bar yAxisId="right" dataKey="pnl" fill="#F0B90B" name="P&L ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="border-t border-bybit-darker px-6 py-3">
                <div className="flex justify-between w-full text-sm text-muted-foreground">
                  <div>Best Strategy: <span className="text-bybit-yellow font-medium">MeanReversion</span></div>
                  <div>Best Sharpe Ratio: <span className="text-bybit-yellow font-medium">2.4</span></div>
                  <div>Highest Win Rate: <span className="text-bybit-yellow font-medium">78%</span></div>
                </div>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Strategy Win Rates</CardTitle>
                  <CardDescription>
                    Win percentage by strategy type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockStrategyPerformance.map((strategy) => (
                      <div key={strategy.name} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-bybit-text">{strategy.name}</span>
                          <span className="text-sm text-bybit-text">{strategy.winRate}%</span>
                        </div>
                        <div className="h-2 bg-bybit-darker rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-bybit-yellow to-bybit-green" 
                            style={{ width: `${strategy.winRate}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Trades: {strategy.trades}</span>
                          <span>P&L: ${strategy.pnl.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Optimal Strategy Combinations</CardTitle>
                  <CardDescription>
                    Best performing strategy combinations based on backtesting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5 py-2">
                    <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-bybit-yellow mr-2" />
                          <span className="font-medium">MeanReversion + ADX Trend</span>
                        </div>
                        <span className="text-bybit-green">+32.5%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Best for volatile markets. Combines mean reversion with trend confirmation.
                      </p>
                    </div>
                    
                    <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-bybit-yellow mr-2" />
                          <span className="font-medium">RSI Divergence + Volume Spike</span>
                        </div>
                        <span className="text-bybit-green">+28.7%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Excellent for detecting reversals. Combines technical divergence with volume confirmation.
                      </p>
                    </div>
                    
                    <div className="bg-bybit-darker p-4 rounded-lg border border-bybit-darker">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-bybit-yellow mr-2" />
                          <span className="font-medium">Supertrend + EMA Crossover</span>
                        </div>
                        <span className="text-bybit-green">+26.1%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Strong trend-following combination. Works best in trending markets with clear direction.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="risk" className="space-y-6 animate-in fade-in-50 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RiskCard 
                title="Value at Risk (95%)"
                value={`$${mockRiskMetrics.valueAtRisk.daily95.toFixed(1)}`}
                subtitle="Daily VaR"
                riskLevel="medium"
              />
              <RiskCard 
                title="Sharpe Ratio"
                value={mockRiskMetrics.sharpeRatio.toFixed(1)}
                subtitle="Risk-adjusted return"
                riskLevel="low"
              />
              <RiskCard 
                title="Max Drawdown"
                value={`${mockRiskMetrics.maxDrawdown.toFixed(1)}%`}
                subtitle="Historical maximum"
                riskLevel="medium"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Portfolio Concentration</CardTitle>
                  <CardDescription>
                    Asset allocation and concentration metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Top Position</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{mockRiskMetrics.concentrationRisk.topPosition}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({mockRiskMetrics.concentrationRisk.topPositionPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${mockRiskMetrics.concentrationRisk.topPositionPct > 30 ? 'bg-bybit-red' : 'bg-bybit-yellow'}`} 
                          style={{ width: `${mockRiskMetrics.concentrationRisk.topPositionPct}%` }}
                        />
                      </div>
                      {mockRiskMetrics.concentrationRisk.topPositionPct > 30 && (
                        <p className="text-xs text-bybit-red mt-1">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          High concentration risk. Consider diversifying.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Diversification Score</span>
                        <span className="text-sm font-medium">
                          {(mockRiskMetrics.concentrationRisk.diversificationScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${mockRiskMetrics.concentrationRisk.diversificationScore > 0.7 ? 'bg-bybit-green' : 'bg-bybit-yellow'}`} 
                          style={{ width: `${mockRiskMetrics.concentrationRisk.diversificationScore * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-bybit-darker">
                      <h4 className="font-medium mb-2">Asset Allocation</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-bybit-darker p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">BTCUSDT</span>
                            <span className="text-xs">35.2%</span>
                          </div>
                        </div>
                        <div className="bg-bybit-darker p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">ETHUSDT</span>
                            <span className="text-xs">28.4%</span>
                          </div>
                        </div>
                        <div className="bg-bybit-darker p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">SOLUSDT</span>
                            <span className="text-xs">15.3%</span>
                          </div>
                        </div>
                        <div className="bg-bybit-darker p-2 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Others</span>
                            <span className="text-xs">21.1%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Correlation Analysis</CardTitle>
                  <CardDescription>
                    Asset correlation and portfolio diversification metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Highest Correlation</span>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">
                            {mockRiskMetrics.correlationRisk.highestPair.join(' / ')}
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({(mockRiskMetrics.correlationRisk.highestValue * 100).toFixed(0)}%)
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${mockRiskMetrics.correlationRisk.highestValue > 0.7 ? 'bg-bybit-red' : 'bg-bybit-yellow'}`} 
                          style={{ width: `${mockRiskMetrics.correlationRisk.highestValue * 100}%` }}
                        />
                      </div>
                      {mockRiskMetrics.correlationRisk.highestValue > 0.7 && (
                        <p className="text-xs text-bybit-red mt-1">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          High correlation between assets reduces diversification benefits.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Average Portfolio Correlation</span>
                        <span className="text-sm font-medium">
                          {(mockRiskMetrics.correlationRisk.avgCorrelation * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${mockRiskMetrics.correlationRisk.avgCorrelation < 0.4 ? 'bg-bybit-green' : 'bg-bybit-yellow'}`} 
                          style={{ width: `${mockRiskMetrics.correlationRisk.avgCorrelation * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-bybit-darker">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {mockRiskMetrics.recommendations.map((rec, i) => (
                          <li key={i} className="text-xs flex items-start">
                            <span className="inline-block h-4 w-4 rounded-full bg-bybit-yellow/20 text-bybit-yellow flex items-center justify-center mr-2 mt-0.5">
                              {i+1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Value at Risk (VaR) Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of portfolio risk metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Daily VaR (95% confidence)</h3>
                    <div className="bg-bybit-darker p-4 rounded-lg">
                      <div className="text-2xl font-bold mb-1">${mockRiskMetrics.valueAtRisk.daily95.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground">
                        Maximum expected loss on 95% of trading days. Only 5% of days should exceed this loss.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Daily VaR (99% confidence)</h3>
                    <div className="bg-bybit-darker p-4 rounded-lg">
                      <div className="text-2xl font-bold mb-1">${mockRiskMetrics.valueAtRisk.daily99.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground">
                        Maximum expected loss on 99% of trading days. Extreme scenario testing.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Weekly VaR (95% confidence)</h3>
                    <div className="bg-bybit-darker p-4 rounded-lg">
                      <div className="text-2xl font-bold mb-1">${mockRiskMetrics.valueAtRisk.weekly95.toFixed(1)}</div>
                      <p className="text-xs text-muted-foreground">
                        Maximum expected loss on 95% of weeks. Medium-term risk assessment.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-bybit-darker px-6 py-3">
                <div className="w-full">
                  <div className="flex items-center mb-1">
                    <div className={`h-2 w-2 rounded-full ${mockRiskMetrics.overallRiskLevel === 'Low' ? 'bg-bybit-green' : mockRiskMetrics.overallRiskLevel === 'Medium' ? 'bg-bybit-yellow' : 'bg-bybit-red'} mr-2`} />
                    <span className="text-sm font-medium">Overall Risk Level: {mockRiskMetrics.overallRiskLevel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on portfolio volatility, concentration, correlation, and historical performance metrics.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="montecarlo" className="space-y-6 animate-in fade-in-50 duration-300">
            <Card className={gradientBg}>
              <CardHeader>
                <CardTitle className="text-bybit-text">Monte Carlo Simulation</CardTitle>
                <CardDescription>
                  Portfolio growth projections based on 10,000 simulations
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[400px] w-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockMonteCarlo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2329" />
                      <XAxis dataKey="month" stroke="#E6E8EA" label={{ value: 'Months', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis stroke="#E6E8EA" label={{ value: 'Portfolio Value ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0B0E11', 
                          borderColor: '#1E2329',
                          color: '#E6E8EA'
                        }}
                        labelStyle={{ color: '#E6E8EA' }}
                      />
                      <Line type="monotone" dataKey="optimistic" name="Optimistic (95th Percentile)" stroke="#1BD19D" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="expected" name="Expected (Median)" stroke="#F0B90B" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="pessimistic" name="Pessimistic (5th Percentile)" stroke="#F6465D" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="border-t border-bybit-darker px-6 py-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">6-Month Expected Return</div>
                    <div className="flex items-center">
                      <TrendingUp className="text-bybit-green h-4 w-4 mr-2" />
                      <span className="text-bybit-green font-medium">+85%</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Probability of Profit</div>
                    <div className="font-medium">78.5%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Risk of Drawdown &gt; 25%</div>
                    <div className="flex items-center">
                      <TrendingDown className="text-bybit-red h-4 w-4 mr-2" />
                      <span className="text-bybit-red font-medium">12.3%</span>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Simulation Parameters</CardTitle>
                  <CardDescription>
                    Key parameters used in Monte Carlo simulation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Number of Simulations</span>
                      <span className="text-sm font-medium">10,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mean Daily Return</span>
                      <span className="text-sm font-medium">0.32%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Standard Deviation (Daily)</span>
                      <span className="text-sm font-medium">2.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk-Free Rate</span>
                      <span className="text-sm font-medium">3.0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Simulation Time Horizon</span>
                      <span className="text-sm font-medium">6 months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Starting Capital</span>
                      <span className="text-sm font-medium">$10,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={gradientBg}>
                <CardHeader>
                  <CardTitle className="text-bybit-text">Key Insights</CardTitle>
                  <CardDescription>
                    Analysis and insights from Monte Carlo simulations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-bybit-darker p-3 rounded-lg hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
                      <h4 className="text-sm font-medium flex items-center">
                        <PieChart className="h-4 w-4 mr-2 text-bybit-yellow" />
                        Probability Distribution
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your strategy shows a positive skew with 78.5% probability of profit over the next 6 months.
                      </p>
                    </div>
                    
                    <div className="bg-bybit-darker p-3 rounded-lg hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
                      <h4 className="text-sm font-medium flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-bybit-yellow" />
                        Risk Assessment
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        There's a 12.3% chance of experiencing a drawdown greater than 25%. Consider implementing stricter stop-losses.
                      </p>
                    </div>
                    
                    <div className="bg-bybit-darker p-3 rounded-lg hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
                      <h4 className="text-sm font-medium flex items-center">
                        <BarChart2 className="h-4 w-4 mr-2 text-bybit-yellow" />
                        Performance Expectation
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expected annualized return of 128% with a Sharpe ratio of 1.85, indicating good risk-adjusted performance.
                      </p>
                    </div>
                    
                    <div className="bg-bybit-darker p-3 rounded-lg hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
                      <h4 className="text-sm font-medium flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-bybit-yellow" />
                        Optimization Opportunity
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reducing allocation to BTCUSDT by 10% and increasing SOLUSDT could improve expected return by 12% while maintaining similar risk profile.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Performance Card Component
function PerformanceCard({ title, value, change, positive, icon }: { title: string, value: string, change: string, positive: boolean, icon: React.ReactNode }) {
  return (
    <Card className="bg-bybit-dark border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${positive ? 'bg-bybit-green/20 text-bybit-green' : 'bg-bybit-red/20 text-bybit-red'}`}>
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className={`text-xs ${positive ? 'text-bybit-green' : 'text-bybit-red'}`}>
          {positive ? '▲' : '▼'} {change} {title === 'Total Trades' ? '' : 'this period'}
        </div>
      </CardContent>
    </Card>
  );
}

// Risk Card Component
function RiskCard({ title, value, subtitle, riskLevel }: { title: string, value: string, subtitle: string, riskLevel: 'low' | 'medium' | 'high' }) {
  const bgColor = 
    riskLevel === 'low' ? 'bg-bybit-green/20 text-bybit-green' : 
    riskLevel === 'medium' ? 'bg-bybit-yellow/20 text-bybit-yellow' : 
    'bg-bybit-red/20 text-bybit-red';
  
  return (
    <Card className="bg-bybit-dark border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className={`px-2 py-1 rounded-full text-xs ${bgColor}`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </CardContent>
    </Card>
  );
}

function TimeRangeSelector({ value, onChange }: { value: string, onChange: (value: string) => void }) {
  return (
    <div className="flex bg-bybit-darker rounded-md p-0.5">
      {['1D', '1W', '1M', '3M', 'YTD', '1Y'].map((range) => (
        <button
          key={range}
          className={`px-2 py-1 text-xs rounded-sm ${value === range ? 'bg-bybit-yellow text-black' : 'text-muted-foreground'}`}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
