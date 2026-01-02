import { useState, useEffect, useCallback, useMemo } from 'react';
import { getVixHistory, getSpxHistory } from '../services/yahooFinance';
import type { CorrelationData } from '../types';

interface UseCorrelationDataOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface UseCorrelationDataResult {
  data: CorrelationData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCorrelationData(
  options: UseCorrelationDataOptions = {}
): UseCorrelationDataResult {
  const {
    startDate = '2020-01-01',
    endDate = new Date().toISOString().split('T')[0],
    enabled = true,
  } = options;

  const [vixData, setVixData] = useState<{ date: string; close: number; year: number }[]>([]);
  const [spxData, setSpxData] = useState<{ date: string; close: number; year: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const [vixResponse, spxResponse] = await Promise.all([
        getVixHistory(startDate, endDate),
        getSpxHistory(startDate, endDate),
      ]);
      setVixData(vixResponse.data);
      setSpxData(spxResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch correlation data'));
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Combine VIX and SPX data, calculate SPX daily change
  const data = useMemo(() => {
    if (vixData.length === 0 || spxData.length === 0) return [];

    const spxMap = new Map(spxData.map((d) => [d.date, d]));
    const result: CorrelationData[] = [];

    let prevSpxClose: number | null = null;

    for (const vix of vixData) {
      const spx = spxMap.get(vix.date);
      if (spx) {
        const spxChange = prevSpxClose
          ? ((spx.close - prevSpxClose) / prevSpxClose) * 100
          : 0;

        result.push({
          date: vix.date,
          vix: vix.close,
          spx: spx.close,
          spxChange: Number(spxChange.toFixed(4)),
          year: vix.year,
        });

        prevSpxClose = spx.close;
      }
    }

    return result;
  }, [vixData, spxData]);

  return { data, isLoading, error, refetch: fetchData };
}
