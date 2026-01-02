import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { period1, period2 } = req.query;

  try {
    const result = await yahooFinance.historical('^VIX', {
      period1: (period1 as string) || '2020-01-01',
      period2: (period2 as string) || new Date().toISOString().split('T')[0],
    });

    const data = result.map((d) => ({
      date: d.date.toISOString().split('T')[0],
      close: d.close,
      high: d.high,
      low: d.low,
      open: d.open,
      year: d.date.getFullYear(),
    }));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json({ data, source: 'yahoo' });
  } catch (error) {
    console.error('VIX API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch VIX data' });
  }
}
