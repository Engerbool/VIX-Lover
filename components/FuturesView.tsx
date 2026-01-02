import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useFuturesData } from '../hooks';
import LoadingState from './LoadingState';

// Available time ranges
const TIME_RANGES = ['1M', '3M', '6M', '1Y', '5Y', 'ALL'];

// Mock Data Generator for Term Structure (Fallback)
const getMockFuturesData = (range: string) => {
  const months = ['Spot', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'];
  let prices: number[] = [];

  switch(range) {
    case '1M':
      prices = [21.5, 20.8, 20.2, 19.8, 19.5, 19.2, 19.0, 18.9];
      break;
    case '3M':
      prices = [18.0, 18.2, 18.5, 18.9, 19.2, 19.4, 19.6, 19.8];
      break;
    case '6M':
      prices = [13.5, 14.8, 15.9, 16.7, 17.4, 17.9, 18.2, 18.5];
      break;
    case '1Y':
      prices = [14.5, 15.2, 16.1, 16.8, 17.2, 17.5, 17.7, 17.9];
      break;
    case '5Y':
      prices = [16.0, 16.5, 17.2, 17.8, 18.2, 18.5, 18.8, 19.0];
      break;
    case 'ALL':
      prices = [19.5, 19.8, 20.1, 20.4, 20.6, 20.8, 21.0, 21.2];
      break;
    default:
      prices = [14.5, 15.2, 16.1, 16.8, 17.2, 17.5, 17.7, 17.9];
  }

  return months.map((month, i) => ({
    month,
    price: prices[i]
  }));
};

const FuturesView: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState('1Y');

  // Fetch real futures data from API
  const { data: apiData, isLoading, error } = useFuturesData();

  // Use API data if available, otherwise mock data based on selected range
  const chartData = useMemo(() => {
    if (apiData && apiData.length > 0) {
      return apiData;
    }
    return getMockFuturesData(selectedRange);
  }, [apiData, selectedRange]);

  // Show loading state
  if (isLoading && (!apiData || apiData.length === 0)) {
    return <LoadingState message="Loading futures data..." />;
  }

  // Calculate derived statistics
  const m1Price = chartData.find(d => d.month === 'M1')?.price || 0;
  const m2Price = chartData.find(d => d.month === 'M2')?.price || 0;
  const spread = m2Price - m1Price;
  const isContango = m2Price >= m1Price;
  
  // Dynamic color for the state text
  const stateColorClass = isContango 
    ? "from-white to-emerald-200" // Greenish/White for Contango
    : "from-white to-rose-300";   // Reddish/White for Backwardation

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        {/* Title with Monochrome Light Beam Border */}
        <h2 className="text-2xl font-bold text-white/90 border-l-[3px] border-transparent border-image-[linear-gradient(to_bottom,#ffffff,#d4d4d8,#71717a,#3f3f46)] pl-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none" style={{borderImageSlice: 1}}>
          Futures Term Structure
        </h2>
        
        {/* Modern Glassy Range Controls */}
        <div className="flex bg-zinc-950/50 backdrop-blur-xl p-1 rounded-full border border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
           {TIME_RANGES.map((range) => (
             <button
               key={range}
               onClick={() => setSelectedRange(range)}
               className={`
                 relative px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300
                 ${selectedRange === range 
                    ? 'text-black bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)] scale-105' 
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                 }
               `}
             >
               {range}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-grow min-h-[400px] w-full bg-zinc-900/20 rounded-xl p-4 border border-white/5 backdrop-blur-md relative overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              {/* Monochrome Veil of Light */}
              <linearGradient id="monoVeilFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.4}/>
                <stop offset="50%" stopColor="#d4d4d8" stopOpacity={0.1}/>
                <stop offset="100%" stopColor="#52525b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="monoVeilStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="50%" stopColor="#e4e4e7"/>
                <stop offset="100%" stopColor="#a1a1aa"/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis 
                dataKey="month" 
                stroke="#52525b" 
                tick={{fill: '#a1a1aa', fontSize: 12}} 
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                domain={['auto', 'auto']} 
                stroke="#52525b" 
                tick={{fill: '#a1a1aa', fontSize: 12}}
                axisLine={false}
                tickLine={false} 
            />
            <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', backdropFilter: 'blur(12px)' }}
                itemStyle={{ color: '#fff' }}
            />
            <Area 
                type="monotone" 
                dataKey="price" 
                stroke="url(#monoVeilStroke)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#monoVeilFill)" 
                filter="drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))"
                animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex gap-4">
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-500">
            <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Structure State</h3>
            <p className={`text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stateColorClass} drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]`}>
                {isContango ? 'Contango' : 'Backwardation'}
            </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex-1 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-500">
            <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-1">M1/M2 Spread</h3>
            <p className="text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                {spread > 0 ? '+' : ''}{spread.toFixed(2)}
            </p>
        </div>
      </div>
    </div>
  );
};

export default FuturesView;