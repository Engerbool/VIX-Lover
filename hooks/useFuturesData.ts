import { useState, useEffect, useCallback } from 'react';
import { getFuturesTermStructure } from '../services/yahooFinance';
import type { FuturesData } from '../types';

interface UseFuturesDataResult {
  data: FuturesData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFuturesData(): UseFuturesDataResult {
  const [data, setData] = useState<FuturesData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getFuturesTermStructure();
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch futures data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
