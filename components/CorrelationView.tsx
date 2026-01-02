import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { useCorrelationData } from '../hooks';
import LoadingState from './LoadingState';

// --- 1. Mock Data Generator (Fallback for API failure) ---
interface CorrelationDataType {
  date: string;
  vix: number;
  spx: number;
  spxChange: number;
  year: number;
}

const generateCorrelationHistory = (): CorrelationDataType[] => {
  const data: CorrelationDataType[] = [];
  const start = new Date('2020-01-01');
  const end = new Date();
  let current = new Date(start);
  let spx = 3230;

  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();

    let baseVol = 0.008;
    let drift = 0.0004;
    let baseVix = 18;

    if (year === 2020 && month === 2) {
        baseVol = 0.04;
        drift = -0.02;
        baseVix = 50;
    } else if (year === 2020 && month > 2) {
        baseVol = 0.015;
        drift = 0.002;
        baseVix = 28;
    } else if (year === 2022) {
        drift = -0.0005;
        baseVol = 0.012;
        baseVix = 24;
    } else if (year >= 2023) {
        baseVol = 0.007;
        baseVix = 14;
    }

    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    const spxChangePercent = (z * baseVol) + drift;
    spx = spx * (1 + spxChangePercent);

    const reactionMultiplier = 400;
    let theoreticalVix = baseVix - (spxChangePercent * reactionMultiplier);
    const noise = (Math.random() - 0.5) * 3;
    let vix = theoreticalVix + noise;

    if (vix < 9.5) vix = 9.5 + Math.random();
    if (vix > 85) vix = 85;
    if (spx < 2200) spx = 2200;

    data.push({
      date: current.toISOString().split('T')[0],
      vix: parseFloat(vix.toFixed(2)),
      spx: parseFloat(spx.toFixed(2)),
      spxChange: parseFloat((spxChangePercent * 100).toFixed(2)),
      year
    });

    current.setDate(current.getDate() + 1);
  }
  return data;
};

// --- Helper: Simple Linear Regression for Trendline ---
const calculateTrendLine = (data: CorrelationDataType[]) => {
    if (data.length < 2) return [];

    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach(d => {
        sumX += d.vix;
        sumY += d.spxChange;
        sumXY += d.vix * d.spxChange;
        sumX2 += d.vix * d.vix;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate two points for the line (min VIX and max VIX in dataset)
    const minVix = Math.min(...data.map(d => d.vix));
    const maxVix = Math.max(...data.map(d => d.vix));

    return [
        { vix: minVix, spxChange: slope * minVix + intercept },
        { vix: maxVix, spxChange: slope * maxVix + intercept }
    ];
};

const CorrelationView: React.FC = () => {
  // Fetch real correlation data from API
  const { data: apiData, isLoading, error } = useCorrelationData({
    startDate: '2020-01-01',
  });

  // State for Range Slider (Indices)
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [rangeInitialized, setRangeInitialized] = useState(false);

  // State for Hover Interaction
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Fallback to mock data if API fails or returns empty
  const mockHistory = useMemo(() => generateCorrelationHistory(), []);
  const fullHistory = useMemo(() => {
    if (apiData && apiData.length > 0) {
      return apiData;
    }
    return mockHistory;
  }, [apiData, mockHistory]);

  const totalDays = fullHistory.length;

  // Initialize range when data loads
  useEffect(() => {
    if (totalDays > 0 && !rangeInitialized) {
      setRange({ start: Math.max(0, totalDays - 365), end: totalDays - 1 });
      setRangeInitialized(true);
    }
  }, [totalDays, rangeInitialized]);

  // Filter Data based on Range
  const chartData = useMemo(() => {
    return fullHistory.slice(
        Math.max(0, range.start),
        Math.min(totalDays, range.end + 1)
    );
  }, [fullHistory, range, totalDays]);

  // Calculate Trendline
  const trendData = useMemo(() => calculateTrendLine(chartData), [chartData]);

  // --- Slider Interaction Logic ---
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'start' | 'end' | null>(null);

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    isDragging.current = type;
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      const index = Math.floor(percent * totalDays);

      setRange(prev => {
        const gap = 30; // Minimum 30 days window
        if (isDragging.current === 'start') {
           return { ...prev, start: Math.min(index, prev.end - gap) };
        } else {
           return { ...prev, end: Math.max(index, prev.start + gap) };
        }
      });
    };

    const handleMouseUp = () => {
      isDragging.current = null;
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [totalDays]);

  // Formatters
  const startDateStr = fullHistory[Math.min(Math.max(0, range.start), totalDays-1)]?.date;
  const endDateStr = fullHistory[Math.min(Math.max(0, range.end), totalDays-1)]?.date;
  const leftPct = totalDays > 0 ? (range.start / totalDays) * 100 : 0;
  const rightPct = totalDays > 0 ? (range.end / totalDays) * 100 : 0;

  // Show loading state (after all hooks)
  if (isLoading && apiData.length === 0) {
    return <LoadingState message="Loading market data..." />;
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white/90 border-l-[3px] border-transparent border-image-[linear-gradient(to_bottom,#ffffff,#d4d4d8,#71717a,#3f3f46)] pl-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none" style={{borderImageSlice: 1}}>
              Market Dynamics
            </h2>
            <p className="mt-2 text-zinc-400 text-xs pl-6">
                VIX Levels (X) vs. S&P 500 Daily Change % (Y)
            </p>
        </div>
        
        {/* Date Display Badge */}
        <div className="flex items-center gap-3 bg-zinc-950/80 px-4 py-2 rounded-lg border border-white/10 shadow-inner backdrop-blur-sm">
            <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Start</p>
                <p className="text-sm font-mono text-white">{startDateStr}</p>
            </div>
            <div className="w-8 h-[1px] bg-zinc-700 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
            <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">End</p>
                <p className="text-sm font-mono text-white">{endDateStr}</p>
            </div>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="w-full h-[500px] bg-zinc-900/20 rounded-xl p-4 border border-white/5 backdrop-blur-md mb-6 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 20,
            }}
            onMouseMove={(state: any) => {
                // Determine hovered index based on Tooltip's active payload
                if (state && state.isTooltipActive && state.activePayload && state.activePayload.length) {
                    const hoveredData = state.activePayload[0].payload;
                    const index = chartData.findIndex(d => d.date === hoveredData.date);
                    if (index !== -1 && index !== hoveredIndex) {
                        setHoveredIndex(index);
                    }
                }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
                <linearGradient id="scatterHoverGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} /> 
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8} /> 
                </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            
            <XAxis 
                type="number" 
                dataKey="vix" 
                name="VIX Index" 
                unit="" 
                domain={['auto', 'auto']}
                stroke="#71717a"
                tick={{fill: '#a1a1aa', fontSize: 11}}
                label={{ value: 'VIX Index (Fear Gauge)', position: 'bottom', offset: 0, fill: '#71717a', fontSize: 12 }}
            />
            
            <YAxis 
                type="number" 
                dataKey="spxChange" 
                name="SPX Change" 
                unit="%" 
                domain={['auto', 'auto']}
                stroke="#71717a"
                tick={{fill: '#a1a1aa', fontSize: 11}}
                label={{ value: 'S&P 500 Daily Change (%)', angle: -90, position: 'insideLeft', fill: '#71717a', fontSize: 12 }}
            />
            
            <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#fb923c', strokeWidth: 1, opacity: 0.5 }}
                animationDuration={0}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-lg backdrop-blur-md shadow-xl">
                                <p className="text-zinc-400 text-xs mb-1 font-mono">{data.date}</p>
                                <div className="flex gap-4">
                                    <div>
                                        <span className="text-xs text-zinc-500 block">VIX</span>
                                        <span className="text-sm font-bold text-white">{data.vix}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-zinc-500 block">SPX Change</span>
                                        <span className={`text-sm font-bold ${data.spxChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {data.spxChange > 0 ? '+' : ''}{data.spxChange}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            {/* Zero Line for SPX Change */}
            <ReferenceLine y={0} stroke="#52525b" strokeWidth={1} />

            {/* Scatter Plots */}
            <Scatter name="Market Days" data={chartData} animationDuration={500}>
                {chartData.map((entry, index) => {
                    const isHovered = index === hoveredIndex;
                    return (
                        <Cell 
                            key={`cell-${entry.date}`} 
                            // Use Gradient for hover to match DistributionView aesthetic
                            fill={isHovered ? 'url(#scatterHoverGradient)' : (entry.spxChange >= 0 ? '#ffffff' : '#71717a')} 
                            fillOpacity={isHovered ? 1 : (entry.spxChange >= 0 ? 0.7 : 0.5)}
                            
                            // Softer Halo stroke
                            stroke={isHovered ? "rgba(249, 115, 22, 0.4)" : "transparent"}
                            strokeWidth={isHovered ? 5 : 0} 
                            
                            style={{ 
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                                cursor: 'pointer'
                            }} 
                            
                            // Direct Event Handlers
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        />
                    );
                })}
            </Scatter>

            {/* Trend Line */}
             <Scatter 
                line={{ stroke: '#facc15', strokeWidth: 2, strokeDasharray: '5 5' }} 
                lineType="fitting"
                shape={() => null} 
                legendType="none"
                data={trendData}
                isAnimationActive={false}
            />

          </ScatterChart>
        </ResponsiveContainer>
        
        {/* Legend Overlay */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/70"></div>
                <span className="text-zinc-400">Up Day</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-500/50"></div>
                <span className="text-zinc-400">Down Day</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-[2px] bg-yellow-400 border-dashed border-t border-transparent"></div>
                <span className="text-yellow-400/80">Trend</span>
            </div>
        </div>
      </div>

      {/* --- Timeline Slider --- */}
      <div className="px-2 select-none pb-4 relative">
        <div 
            ref={trackRef}
            className="relative h-20 w-full flex items-center cursor-crosshair group pt-4"
        >
            {/* Background Track */}
            <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                {/* Year Markers */}
                <div className="absolute inset-0 flex justify-between px-2 items-center opacity-30">
                     {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                         <div key={y} className="w-[1px] h-full bg-white/50"></div>
                     ))}
                </div>
            </div>

            {/* Active Range Bar */}
            <div 
                className="absolute h-1.5 bg-gradient-to-r from-zinc-600 via-orange-500 to-zinc-600 shadow-[0_0_10px_rgba(249,115,22,0.5)] rounded-full z-10 pointer-events-none"
                style={{ 
                    left: `${leftPct}%`, 
                    width: `${rightPct - leftPct}%` 
                }}
            ></div>

            {/* Left Handle */}
            <div
                onMouseDown={handleMouseDown('start')}
                className="absolute w-5 h-5 -mt-[1px] bg-zinc-950 border border-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] cursor-ew-resize z-20 flex items-center justify-center hover:scale-125 transition-transform active:scale-95"
                style={{ left: `calc(${leftPct}% - 10px)` }}
            >
                 <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            </div>

            {/* Right Handle */}
            <div
                onMouseDown={handleMouseDown('end')}
                className="absolute w-5 h-5 -mt-[1px] bg-zinc-950 border border-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] cursor-ew-resize z-20 flex items-center justify-center hover:scale-125 transition-transform active:scale-95"
                style={{ left: `calc(${rightPct}% - 10px)` }}
            >
                 <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
            </div>

            {/* Labels - Increased Spacing */}
            <div className="absolute top-14 left-0 right-0 flex justify-between text-[9px] text-zinc-400 font-mono pointer-events-none px-1 uppercase tracking-widest z-0">
                <span>2020</span>
                <span>2021</span>
                <span>2022</span>
                <span>2023</span>
                <span>2024</span>
                <span>Now</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CorrelationView;