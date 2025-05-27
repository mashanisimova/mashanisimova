'use client';

import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useTheme } from 'next-themes';
import { useBybitAuth } from '@/lib/hooks/useBybitAuth';
import { useKlineData } from '@/lib/hooks/useMarketData';

const intervals = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '30', label: '30m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: '1D' },
];

type ChartContainerProps = {
  symbol: string;
  height?: number;
  width?: string;
  showVolume?: boolean;
  indicators?: string[];
};

export function ChartContainer({ 
  symbol, 
  height = 400, 
  width = '100%', 
  showVolume = true,
  indicators = ['ma']
}: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartCreated, setChartCreated] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);
  const [volumeSeries, setVolumeSeries] = useState<ISeriesApi<"Histogram"> | null>(null);
  const [selectedInterval, setSelectedInterval] = useState('15');
  const { isAuthenticated } = useBybitAuth();
  const { theme } = useTheme();
  const { data, isLoading } = useKlineData(symbol, selectedInterval, isAuthenticated);
  
  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartCreated) return;
    
    const isDarkTheme = theme === 'dark';
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDarkTheme ? '#0B0E11' : '#ffffff' },
        textColor: isDarkTheme ? '#E6E8EA' : '#374151',
      },
      grid: {
        vertLines: { color: isDarkTheme ? 'rgba(30, 35, 41, 0.5)' : 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: isDarkTheme ? 'rgba(30, 35, 41, 0.5)' : 'rgba(42, 46, 57, 0.2)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: isDarkTheme ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.8)',
      },
      rightPriceScale: {
        borderColor: isDarkTheme ? 'rgba(197, 203, 206, 0.3)' : 'rgba(197, 203, 206, 0.8)',
      },
      crosshair: {
        mode: 0,
      },
    });
    
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#1BD19D',
      downColor: '#F6465D',
      borderVisible: false,
      wickUpColor: '#1BD19D',
      wickDownColor: '#F6465D',
    });
    
    setCandleSeries(candlestickSeries);
    setChartCreated(chart);
    
    if (showVolume) {
      // Add volume histogram
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      setVolumeSeries(volumeSeries);
    }
    
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      setChartCreated(null);
      setCandleSeries(null);
      setVolumeSeries(null);
    };
  }, [theme, height, showVolume]);
  
  // Update chart when new data arrives
  useEffect(() => {
    if (!candleSeries || !data || data.length === 0) return;
    
    const ohlcData = data.map((item: string[]) => ({
      time: parseInt(item[0]) / 1000,
      open: parseFloat(item[1]),
      high: parseFloat(item[2]),
      low: parseFloat(item[3]),
      close: parseFloat(item[4])
    })).reverse();
    
    candleSeries.setData(ohlcData);
    
    if (showVolume && volumeSeries) {
      const volumeData = data.map((item: string[]) => ({
        time: parseInt(item[0]) / 1000,
        value: parseFloat(item[5]),
        color: parseFloat(item[4]) >= parseFloat(item[1]) ? 'rgba(27, 209, 157, 0.5)' : 'rgba(246, 70, 93, 0.5)'
      })).reverse();
      
      volumeSeries.setData(volumeData);
    }
    
    // Add moving averages if requested
    if (indicators.includes('ma') && chartCreated) {
      addMovingAverages(ohlcData, chartCreated);
    }
    
    // Auto-scale the chart to fit the data
    if (chartCreated) {
      chartCreated.timeScale().fitContent();
    }
  }, [data, candleSeries, volumeSeries, showVolume, chartCreated, indicators]);
  
  // Handle theme changes
  useEffect(() => {
    if (!chartCreated) return;
    
    const isDarkTheme = theme === 'dark';
    
    chartCreated.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: isDarkTheme ? '#0B0E11' : '#ffffff' },
        textColor: isDarkTheme ? '#E6E8EA' : '#374151',
      },
      grid: {
        vertLines: { color: isDarkTheme ? 'rgba(30, 35, 41, 0.5)' : 'rgba(42, 46, 57, 0.2)' },
        horzLines: { color: isDarkTheme ? 'rgba(30, 35, 41, 0.5)' : 'rgba(42, 46, 57, 0.2)' },
      },
    });
  }, [theme, chartCreated]);
  
  const addMovingAverages = (data: any[], chart: IChartApi) => {
    // Calculate and add MA20
    const ma20Data = calculateMA(data, 20);
    const ma20Series = chart.addLineSeries({ color: '#F0B90B', lineWidth: 1.5, title: 'MA20' });
    ma20Series.setData(ma20Data);
    
    // Calculate and add MA50
    const ma50Data = calculateMA(data, 50);
    const ma50Series = chart.addLineSeries({ color: '#1BD19D', lineWidth: 1.5, title: 'MA50' });
    ma50Series.setData(ma50Data);
  };
  
  const calculateMA = (data: any[], period: number) => {
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      
      result.push({
        time: data[i].time,
        value: sum / period
      });
    }
    
    return result;
  };
  
  return (
    <div className="w-full">
      <div className="flex space-x-1 mb-2 overflow-x-auto pb-1">
        {intervals.map((interval) => (
          <button
            key={interval.value}
            onClick={() => setSelectedInterval(interval.value)}
            className={`px-2 py-1 text-xs rounded ${selectedInterval === interval.value ? 'bg-bybit-yellow text-black' : 'bg-bybit-darker text-bybit-text'}`}
          >
            {interval.label}
          </button>
        ))}
      </div>
      
      <div className="relative rounded-lg overflow-hidden border border-bybit-darker/60" style={{ width, height }}>
        <div ref={chartContainerRef} className="absolute inset-0" />
        
        {(!isAuthenticated || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-bybit-darker/70 backdrop-blur-sm">
            {isLoading ? (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-bybit-yellow border-r-bybit-yellow border-b-transparent border-l-transparent"></div>
                <p className="mt-2 text-bybit-text">Loading chart data...</p>
              </div>
            ) : (
              <p className="text-bybit-text">Connect to view chart</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
