'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { Gauge } from 'lucide-react';

type AISignal = {
  strategy: string;
  direction: 'buy' | 'sell' | 'neutral';
  confidence: number;
  explanation: string;
  prediction: number;
  timeframe: string;
};

export function AIDecisionPanel({ symbol }: { symbol: string }) {
  const { isAuthenticated } = useBybitAuth();
  const [aiSignal, setAiSignal] = useState<AISignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  // Mock AI signal data - in a real app, this would come from your AI trading module
  useEffect(() => {
    if (isAuthenticated) {
      // Simulate API call delay
      const timer = setTimeout(() => {
        const mockSignals: Record<string, AISignal> = {
          'BTCUSDT': {
            strategy: 'Ensemble (RSI + Macro + Sentiment)',
            direction: 'buy',
            confidence: 78,
            explanation: 'Strong buy signal based on oversold RSI conditions, positive DXY correlation divergence, and increasing institutional flow. On-chain metrics show accumulation pattern.',
            prediction: 3.2,
            timeframe: '24h'
          },
          'ETHUSDT': {
            strategy: 'NLP + Technical',
            direction: 'buy',
            confidence: 65,
            explanation: 'Moderate buy signal from improving sentiment analysis and bullish MACD crossover. Recent development news has been positive.',
            prediction: 2.1,
            timeframe: '24h'
          },
          'SOLUSDT': {
            strategy: 'MEV + Order Flow',
            direction: 'sell',
            confidence: 72,
            explanation: 'Bearish signal detected from increasing MEV activities and large sell walls in order book. Cross-chain outflows detected.',
            prediction: -4.5,
            timeframe: '24h'
          },
          'XRPUSDT': {
            strategy: 'Institutional Flow + Technical',
            direction: 'neutral',
            confidence: 52,
            explanation: 'Mixed signals with institutional flow showing slight accumulation but technical indicators are neutral. Range-bound trading likely.',
            prediction: 0.5,
            timeframe: '24h'
          },
          'DOGEUSDT': {
            strategy: 'Social Sentiment + Whale Analysis',
            direction: 'buy',
            confidence: 68,
            explanation: 'Buy signal from improving social sentiment metrics and recent whale wallet accumulation. Volatility expected due to memecoin nature.',
            prediction: 5.8,
            timeframe: '24h'
          }
        };
        
        setAiSignal(mockSignals[symbol] || mockSignals['BTCUSDT']);
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
      setAiSignal(null);
    }
  }, [isAuthenticated, symbol]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-amber-500';
  };
  
  const getDirectionColor = (direction: string) => {
    if (direction === 'buy') return 'text-bybit-green';
    if (direction === 'sell') return 'text-bybit-red';
    return 'text-yellow-500';
  };
  
  const getPredictionColor = (prediction: number) => {
    if (prediction > 0) return 'text-bybit-green';
    if (prediction < 0) return 'text-bybit-red';
    return 'text-yellow-500';
  };
  
  return (
    <Card className="bg-gradient-to-br from-bybit-dark to-bybit-darker border-bybit-darker transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-bybit-text flex items-center justify-between">
          <span className="flex items-center">
            <Gauge className="mr-2 h-5 w-5 text-bybit-yellow" />
            AI Decision Engine
          </span>
          {aiSignal && (
            <span className={`text-sm font-normal ${getConfidenceColor(aiSignal.confidence)}`}>
              {aiSignal.confidence}% confidence
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-bybit-yellow"></div>
          </div>
        ) : aiSignal ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Strategy</div>
                <div className="font-medium">{aiSignal.strategy}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Signal</div>
                <div className={`font-bold uppercase ${getDirectionColor(aiSignal.direction)}`}>
                  {aiSignal.direction}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-muted-foreground">Predicted Move</div>
                <div className={`font-medium ${getPredictionColor(aiSignal.prediction)}`}>
                  {aiSignal.prediction > 0 ? '+' : ''}{aiSignal.prediction}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Timeframe</div>
                <div className="font-medium">{aiSignal.timeframe}</div>
              </div>
            </div>
            
            {expanded && (
              <div className="pt-2 border-t border-bybit-darker/50">
                <div className="text-sm text-muted-foreground mb-1">Analysis</div>
                <p className="text-sm">{aiSignal.explanation}</p>
              </div>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setExpanded(!expanded)} 
              className="w-full text-xs text-muted-foreground hover:text-bybit-yellow hover:bg-transparent">
              {expanded ? 'Show Less' : 'Show Analysis'}
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect to view AI signals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
