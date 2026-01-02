import type { DailyVixData, DailySpxData, FuturesData, DataSource } from './market';

export interface VixHistoryResponse {
  data: DailyVixData[];
  source: DataSource;
}

export interface SpxHistoryResponse {
  data: DailySpxData[];
  source: DataSource;
}

export interface FuturesResponse {
  data: FuturesData[];
  source: DataSource;
}

export interface ApiError {
  error: string;
}
