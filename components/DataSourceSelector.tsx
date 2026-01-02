import React from 'react';
import { useDataSource } from '../context/DataSourceContext';
import type { DataSource } from '../types';

const DataSourceSelector: React.FC = () => {
  const { source, setSource, lastUpdated } = useDataSource();

  const sources: { id: DataSource; label: string }[] = [
    { id: 'yahoo', label: 'Yahoo' },
    { id: 'cboe', label: 'CBOE' },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
        Source
      </span>
      <div className="flex bg-zinc-950/80 p-1 rounded-full border border-white/10 backdrop-blur-sm">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={`
              px-3 py-1 text-[10px] font-bold rounded-full transition-all duration-300
              ${source === s.id
                ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {s.label}
          </button>
        ))}
      </div>
      {lastUpdated && (
        <span className="text-[9px] text-zinc-600 font-mono">
          {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default DataSourceSelector;
