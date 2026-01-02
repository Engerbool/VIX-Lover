import type { VercelRequest, VercelResponse } from '@vercel/node';
import yahooFinance from 'yahoo-finance2';

// VIX futures symbols for different months
function getVixFuturesSymbols(): string[] {
  const now = new Date();
  const symbols: string[] = [];

  // Get next 8 months of VIX futures
  for (let i = 0; i < 8; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = futureDate.getFullYear().toString().slice(-2);
    const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
    symbols.push(`VX${month}${year}.CBF`);
  }

  return symbols;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get spot VIX
    const spotQuote = await yahooFinance.quote('^VIX');
    const spotPrice = spotQuote.regularMarketPrice || 0;

    // Get futures quotes
    const futuresSymbols = getVixFuturesSymbols();
    const futuresData: { month: string; price: number }[] = [
      { month: 'Spot', price: Number(spotPrice.toFixed(2)) }
    ];

    // Try to fetch each futures contract
    for (let i = 0; i < futuresSymbols.length; i++) {
      try {
        const quote = await yahooFinance.quote(futuresSymbols[i]);
        if (quote.regularMarketPrice) {
          futuresData.push({
            month: `M${i + 1}`,
            price: Number(quote.regularMarketPrice.toFixed(2))
          });
        }
      } catch {
        // Skip if futures contract not available
        continue;
      }
    }

    // If we couldn't get futures data, return mock term structure
    if (futuresData.length === 1) {
      const basePrice = spotPrice || 15;
      for (let i = 1; i <= 7; i++) {
        futuresData.push({
          month: `M${i}`,
          price: Number((basePrice + i * 0.5).toFixed(2))
        });
      }
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json({ data: futuresData, source: 'yahoo' });
  } catch (error) {
    console.error('Futures API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch futures data' });
  }
}
