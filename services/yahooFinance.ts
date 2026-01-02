import { fetchWithTimeout, getApiBaseUrl } from './api';
import type { VixHistoryResponse, SpxHistoryResponse, FuturesResponse } from '../types';

export async function getVixHistory(
  startDate: string,
  endDate: string
): Promise<VixHistoryResponse> {
  const baseUrl = getApiBaseUrl();
  return fetchWithTimeout<VixHistoryResponse>(
    `${baseUrl}/vix?period1=${startDate}&period2=${endDate}`
  );
}

export async function getSpxHistory(
  startDate: string,
  endDate: string
): Promise<SpxHistoryResponse> {
  const baseUrl = getApiBaseUrl();
  return fetchWithTimeout<SpxHistoryResponse>(
    `${baseUrl}/spx?period1=${startDate}&period2=${endDate}`
  );
}

export async function getFuturesTermStructure(): Promise<FuturesResponse> {
  const baseUrl = getApiBaseUrl();
  return fetchWithTimeout<FuturesResponse>(`${baseUrl}/futures`);
}
