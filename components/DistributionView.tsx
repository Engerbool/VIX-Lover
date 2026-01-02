import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label
} from 'recharts';
import type { DailyVixData } from '../types';

interface DistributionViewProps {
  data: DailyVixData[];
  isLoading: boolean;
  error: Error | null;
}

const DistributionView: React.FC<DistributionViewProps> = ({ data, isLoading, error }) => {


  // State for Range Slider
  const [range, setRange] = useState({ start: 0, end: 0 });
  const [rangeInitialized, setRangeInitialized] = useState(false);

  // State for Bin Granularity (1, 0.5, 0.1)
  const [binSize, setBinSize] = useState<number>(1);

  // State for Hover Interaction
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use data from props
  const fullHistory = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      close: d.close,
      year: d.year
    }));
  }, [data]);

  const totalDays = fullHistory.length;

  // Initialize and clamp range when data loads or changes
  useEffect(() => {
    if (totalDays > 0) {
      setRange(prev => {
        const maxEnd = totalDays - 1;
        // First load: initialize to full range
        if (!rangeInitialized) {
          setRangeInitialized(true);
          return { start: 0, end: maxEnd };
        }
        // Data changed: clamp end to valid range
        if (prev.end > maxEnd) {
          return { ...prev, end: maxEnd };
        }
        return prev;
      });
    }
  }, [totalDays, rangeInitialized]);

  // Compute Histogram based on Range and Bin Size
  const { chartData, meanVix, medianVix, xAxisTicks } = useMemo(() => {
    // 1. Slice data - use full range if not initialized yet OR if range is invalid
    const rangeIsValid = range.end > range.start && range.end < totalDays;
    const sliced = (!rangeInitialized || !rangeIsValid) && totalDays > 0
      ? fullHistory.slice(0, totalDays)
      : fullHistory.slice(Math.max(0, range.start), Math.min(totalDays, range.end + 1));

    // 2. Statistics
    const sum = sliced.reduce((acc, curr) => acc + curr.close, 0);
    const mean = sliced.length ? sum / sliced.length : 0;
    
    const sorted = [...sliced].sort((a, b) => a.close - b.close);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)].close : 0;

    if (sliced.length === 0) {
      return { chartData: [], meanVix: 0, medianVix: 0, xAxisTicks: [] };
    }

    // 3. Dynamic Bucketing
    const rawMin = Math.min(...sliced.map(d => d.close));
    const rawMax = Math.max(...sliced.map(d => d.close));
    
    // Round min/max to nice boundaries
    const minBucket = Math.floor(rawMin / binSize) * binSize;
    const maxBucket = Math.ceil(rawMax / binSize) * binSize;

    // Generate buckets
    const buckets: Record<string, number> = {};
    const decimals = binSize === 0.1 ? 1 : binSize === 0.5 ? 1 : 0;
    
    for (let b = minBucket; b <= maxBucket; b += binSize) {
        const key = b.toFixed(decimals);
        buckets[key] = 0;
    }

    sliced.forEach(day => {
        const bucketVal = Math.floor(day.close / binSize) * binSize;
        const key = bucketVal.toFixed(decimals);
        if (buckets[key] !== undefined) {
            buckets[key]++;
        }
    });

    // Convert to array
    const chartDataArray = Object.keys(buckets).map(key => ({
        range: key, 
        numericValue: parseFloat(key),
        count: buckets[key],
        topPercentile: "" // Placeholder
    }));

    // Ensure sorted by numeric value for correct cumulative calculation and display
    chartDataArray.sort((a, b) => a.numericValue - b.numericValue);

    // 4. Calculate Top Percentile (Cumulative Count from Right)
    // "Top X%" means: X% of days have a VIX >= this level.
    let accumulated = 0;
    const totalCount = sliced.length;
    
    for (let i = chartDataArray.length - 1; i >= 0; i--) {
        accumulated += chartDataArray[i].count;
        const pct = totalCount > 0 ? (accumulated / totalCount) * 100 : 0;
        // Formatting: if very small but not 0, show <0.1
        chartDataArray[i].topPercentile = (pct < 0.1 && pct > 0) ? "<0.1" : pct.toFixed(1);
    }

    // 5. Smart Tick Generation (Ruler Style)
    const ticks: string[] = [];
    const spread = maxBucket - minBucket;
    let labelStep = 5; 
    
    if (spread < 5) labelStep = 1;       
    else if (spread < 15) labelStep = 2; 
    else if (spread > 60) labelStep = 10; 

    for (let i = Math.floor(minBucket); i <= Math.ceil(maxBucket); i++) {
        if (i % labelStep === 0) {
             const key = i.toFixed(decimals);
             ticks.push(key);
        }
    }

    return {
        chartData: chartDataArray,
        meanVix: mean,
        medianVix: median,
        xAxisTicks: ticks
    };
  }, [fullHistory, range, totalDays, binSize, rangeInitialized]);

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
           // Left handle: cannot go below 0 or beyond (end - gap)
           return { ...prev, start: Math.max(0, Math.min(index, prev.end - gap)) };
        } else {
           // Right handle: cannot exceed (totalDays - 1) or go below (start + gap)
           return { ...prev, end: Math.min(totalDays - 1, Math.max(index, prev.start + gap)) };
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

  // Helper to format date display - handle uninitialized state
  const displayStart = rangeInitialized ? range.start : 0;
  const displayEnd = rangeInitialized ? range.end : totalDays - 1;
  const startDateStr = totalDays > 0 ? fullHistory[Math.min(Math.max(0, displayStart), totalDays-1)]?.date : '';
  const endDateStr = totalDays > 0 ? fullHistory[Math.min(Math.max(0, displayEnd), totalDays-1)]?.date : '';

  // Clamp range values for display calculations
  const clampedStart = Math.max(0, Math.min(displayStart, totalDays - 1));
  const clampedEnd = Math.max(0, Math.min(displayEnd, totalDays - 1));
  const maxIndex = totalDays > 1 ? totalDays - 1 : 1;
  const leftPct = (clampedStart / maxIndex) * 100;
  const rightPct = (clampedEnd / maxIndex) * 100;

  // Show loading state (after all hooks)
  if (isLoading && data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center"><div className="text-zinc-500">Loading VIX history...</div></div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white/90 border-l-[3px] border-transparent border-image-[linear-gradient(to_bottom,#ffffff,#d4d4d8,#71717a,#3f3f46)] pl-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] leading-none" style={{borderImageSlice: 1}}>
            Historical Distribution
            </h2>
            <div className="mt-2 pl-6 flex items-center gap-4 text-xs">
                <div className="flex flex-col">
                    <span className="text-zinc-500">Median</span>
                    <span className="text-white font-mono font-bold text-lg">{medianVix.toFixed(2)}</span>
                </div>
                <div className="w-[1px] h-8 bg-white/10"></div>
                <div className="flex flex-col">
                    <span className="text-zinc-500">Average</span>
                    <span className="text-zinc-300 font-mono font-bold text-lg">{meanVix.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
            {/* Bin Size Controls */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tick Size</span>
                <div className="flex bg-zinc-950/80 p-1 rounded-lg border border-white/10 backdrop-blur-sm">
                    {[1, 0.5, 0.1].map(size => (
                        <button
                            key={size}
                            onClick={() => setBinSize(size)}
                            className={`
                                px-3 py-1 text-[10px] font-bold rounded transition-all duration-300
                                ${binSize === size 
                                    ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }
                            `}
                        >
                            {size}
                        </button>
                    ))}
                </div>
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
      </div>
      
      {/* Chart Area */}
      <div className="h-[450px] w-full bg-zinc-900/20 rounded-xl p-4 border border-white/5 backdrop-blur-md relative mb-6">
        {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            barCategoryGap={binSize === 0.1 ? 0 : 1}
            onMouseMove={(state: any) => {
              if (state && state.isTooltipActive) {
                const activeLabel = state.activeLabel;
                let index = state.activeTooltipIndex;

                // Robust fallback using activeLabel (String comparison)
                if (activeLabel !== undefined) {
                    // Find index where range matches activeLabel
                    // Ensure we compare strings to avoid type mismatches
                    const foundIndex = chartData.findIndex(d => String(d.range) === String(activeLabel));
                    if (foundIndex !== -1) {
                        index = foundIndex;
                    }
                }

                if (index !== undefined && index !== null && index !== hoveredIndex) {
                    setHoveredIndex(index);
                }
              } else {
                if (hoveredIndex !== null) {
                    setHoveredIndex(null);
                }
              }
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.9} /> 
                    <stop offset="50%" stopColor="#d4d4d8" stopOpacity={0.6} /> 
                    <stop offset="100%" stopColor="#52525b" stopOpacity={0.3} /> 
                </linearGradient>
                <linearGradient id="peakGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} /> 
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.8} /> 
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            
            <XAxis 
                dataKey="range" 
                stroke="#52525b" 
                ticks={xAxisTicks} 
                tick={{fill: '#a1a1aa', fontSize: 12, fontWeight: 600 }} 
                axisLine={{ stroke: '#52525b', strokeWidth: 1 }}
                tickLine={{ stroke: '#52525b', strokeWidth: 2, height: 8 }} 
                dy={5}
                label={{ value: 'VIX Level', position: 'bottom', offset: 0, fill: '#52525b', fontSize: 11 }}
            />
            <YAxis 
                stroke="#52525b" 
                tick={{fill: '#a1a1aa', fontSize: 11}} 
                axisLine={false} 
                tickLine={false} 
                label={{ value: 'Frequency (Days)', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 11 }}
            />
            
            <Tooltip 
                cursor={{ fill: '#27272a', opacity: 0.4 }} // Gray background box - The condition user wants to match
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-zinc-950/90 border border-white/10 p-3 rounded-lg backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] pointer-events-none">
                                <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-1">VIX Level {data.range}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-white">{data.count}</span>
                                    <span className="text-xs text-zinc-400">days</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-4">
                                    <span className="text-xs text-zinc-400">Top</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-sm font-mono text-orange-400 font-bold">{data.topPercentile}%</span>
                                    </div>
                                </div>
                                <p className="text-[9px] text-zinc-600 mt-1">of days are higher than this level</p>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            <ReferenceLine x={(20).toFixed(binSize === 0.1 ? 1 : binSize === 0.5 ? 1 : 0)} stroke="#facc15" strokeDasharray="3 3" opacity={0.5}>
                <Label value="ELEVATED (20)" position="insideTopRight" fill="#facc15" fontSize={10} className="font-mono tracking-widest" />
            </ReferenceLine>

            <ReferenceLine x={(30).toFixed(binSize === 0.1 ? 1 : binSize === 0.5 ? 1 : 0)} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.5}>
                <Label value="CRISIS (30)" position="insideTopRight" fill="#f43f5e" fontSize={10} className="font-mono tracking-widest" />
            </ReferenceLine>
            
            <Bar dataKey="count" radius={[2, 2, 0, 0]} animationDuration={300}>
                {chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={index === hoveredIndex ? 'url(#peakGradient)' : 'url(#barGradient)'} 
                        fillOpacity={index === hoveredIndex ? 1 : 0.6}
                        stroke={index === hoveredIndex ? "rgba(249, 115, 22, 0.5)" : "transparent"}
                        // Removed CSS transition for instant sync with cursor
                    />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-zinc-500 text-sm">Loading chart...</div>
          </div>
        )}

        {/* Annotations */}
        <div className="absolute top-6 right-6 text-right hidden sm:block">
            <p className="text-xs text-zinc-500 max-w-[150px] leading-relaxed">
                <span className="text-orange-400 font-bold">Log-Normal Distribution</span>. 
                VIX clusters tightly at low levels (12-18) but has a long tail for crisis events.
            </p>
        </div>
      </div>

      {/* --- Custom Time Slider --- */}
      <div className="px-2 select-none pb-4 relative">
        <div 
            ref={trackRef}
            className="relative h-20 w-full flex items-center cursor-crosshair group pt-4"
        >
            {/* Background Track (Full History) */}
            <div className="absolute left-0 right-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                {/* Year Markers on Track */}
                <div className="absolute inset-0 flex justify-between px-2 items-center opacity-30">
                     {[2020, 2021, 2022, 2023, 2024, 2025].map(y => (
                         <div key={y} className="w-[1px] h-full bg-white/50"></div>
                     ))}
                </div>
            </div>

            {/* Active Range Bar (Selected Period) */}
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

            {/* Year Labels below track - Increased Spacing */}
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

export default DistributionView;