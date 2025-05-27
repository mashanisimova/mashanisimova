"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BotsPage() {
  return (
    <div className="animate-in fade-in-50 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-bybit-text">Trading Bots</h1>
        <Button className="bg-bybit-yellow text-black hover:bg-bybit-yellow/80 shadow-md hover:shadow-bybit-yellow/20 transition-all duration-300 transform hover:-translate-y-1">
          Create New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-bybit-dark border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-bybit-text">Advanced Trading Bot</CardTitle>
              <Badge className="bg-bybit-green">Active</Badge>
            </div>
            <CardDescription>
              AI-powered multi-strategy bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strategy</span>
                <span>Multi-strategy AI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pairs</span>
                <span>BTC, ETH, SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit</span>
                <span className="text-bybit-green">+23.45%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Win Rate</span>
                <span>68.2%</span>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-bybit-darker hover:bg-bybit-yellow/20 hover:text-bybit-yellow" asChild>
                <Link href="/dashboard/bots/bybit-advanced-bot">Configure</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bybit-dark border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-bybit-text">DCA Bot</CardTitle>
              <Badge className="bg-bybit-green">Active</Badge>
            </div>
            <CardDescription>
              Dollar Cost Averaging Strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strategy</span>
                <span>DCA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pair</span>
                <span>BTC/USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit</span>
                <span className="text-bybit-green">+12.34%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span>Daily</span>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-bybit-darker hover:bg-bybit-yellow/20 hover:text-bybit-yellow">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bybit-dark border-bybit-darker hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-bybit-text">Grid Bot</CardTitle>
              <Badge variant="outline" className="bg-bybit-red/20 text-bybit-red">Inactive</Badge>
            </div>
            <CardDescription>
              Grid Trading Strategy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Strategy</span>
                <span>Grid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pair</span>
                <span>ETH/USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profit</span>
                <span>0.00%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grid Range</span>
                <span>$2,500 - $3,200</span>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-bybit-darker hover:bg-bybit-yellow/20 hover:text-bybit-yellow">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-bybit-dark border-bybit-darker border-dashed flex flex-col items-center justify-center py-8 hover:shadow-lg hover:shadow-bybit-yellow/10 transition-all duration-300 transform hover:-translate-y-1 group cursor-pointer">
          <div className="text-4xl text-bybit-yellow mb-4 transform transition-transform group-hover:scale-125 group-hover:rotate-90 duration-300">+</div>
          <CardTitle className="text-bybit-text mb-2">New Bot</CardTitle>
          <CardDescription className="text-center mb-4">
            Create a new trading bot with your custom strategy
          </CardDescription>
          <Button className="bg-bybit-yellow text-black hover:bg-bybit-yellow/80 shadow-md hover:shadow-bybit-yellow/20 transition-all duration-300 transform group-hover:scale-105">
            Create Bot
          </Button>
        </Card>
      </div>
      
      <div className="p-4 bg-bybit-yellow/10 border border-bybit-yellow/20 rounded-md shadow-inner animate-in fade-in-50 duration-700">
        <h2 className="text-lg font-medium text-bybit-yellow mb-2">Advanced Features</h2>
        <p className="text-sm mb-4">
          Your Bybit trading bot includes cutting-edge technologies that set it apart from standard bots:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">Multi-Strategy AI</h3>
            <p className="text-xs text-muted-foreground">Advanced machine learning algorithms that adapt to market conditions</p>
          </div>
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">On-Chain Analysis</h3>
            <p className="text-xs text-muted-foreground">Real-time blockchain data to identify whale movements and market sentiment</p>
          </div>
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">Quantum Optimization</h3>
            <p className="text-xs text-muted-foreground">Quantum-inspired algorithms for parameter optimization and backtesting</p>
          </div>
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">Flash Crash Protection</h3>
            <p className="text-xs text-muted-foreground">Predictive models to detect market conditions preceding flash crashes</p>
          </div>
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">MEV Monitoring</h3>
            <p className="text-xs text-muted-foreground">Track front-running and sandwich attacks as early volatility indicators</p>
          </div>
          <div className="p-3 bg-bybit-darker rounded-md hover:bg-gradient-to-r hover:from-bybit-darker hover:to-bybit-dark border border-transparent hover:border-bybit-yellow/20 transition-all duration-300">
            <h3 className="font-medium mb-1">Telegram Reporting</h3>
            <p className="text-xs text-muted-foreground">Detailed trade reports and daily summaries delivered via Telegram</p>
          </div>
        </div>
      </div>
    </div>
  );
}