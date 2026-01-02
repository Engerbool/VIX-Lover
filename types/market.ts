export interface DailyVixData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  open?: number;
  year: number;
}

export interface DailySpxData {
  date: string;
  close: number;
  high?: number;
  low?: number;
  open?: number;
  year: number;
}

export interface CorrelationData {
  date: string;
  vix: number;
  spx: number;
  spxChange: number;
  year: number;
}

export interface FuturesData {
  month: string;
  price: number;
}

export type DataSource = 'yahoo' | 'cboe';

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';
