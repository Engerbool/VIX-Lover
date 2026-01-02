import { useState, useEffect, useCallback } from 'react';
import { getVixHistory } from '../services/yahooFinance';
import type { DailyVixData } from '../types';

interface UseVixHistoryOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface UseVixHistoryResult {
  data: DailyVixData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useVixHistory(
  options: UseVixHistoryOptions = {}
): UseVixHistoryResult {
  const {
    startDate = '2020-01-01',
    endDate = new Date().toISOString().split('T')[0],
    enabled = true,
  } = options;

  const [data, setData] = useState<DailyVixData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getVixHistory(startDate, endDate);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch VIX data'));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
