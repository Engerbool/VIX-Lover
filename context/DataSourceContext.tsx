import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { DataSource } from '../types';

interface DataSourceContextType {
  source: DataSource;
  setSource: (source: DataSource) => void;
  lastUpdated: Date | null;
  setLastUpdated: (date: Date) => void;
}

const DataSourceContext = createContext<DataSourceContextType | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<DataSource>('yahoo');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const value = {
    source,
    setSource,
    lastUpdated,
    setLastUpdated,
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }
  return context;
}
