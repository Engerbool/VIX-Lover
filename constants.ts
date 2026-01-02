import { NavItem, View } from './types';

export const NAV_ITEMS: NavItem[] = [
  { id: View.DISTRIBUTION, label: 'Distribution' },
  { id: View.CORRELATION, label: 'Correlation' },
  { id: View.FUTURES, label: 'Futures' },
  { id: View.TBD1, label: 'TBD' },
  { id: View.TBD2, label: 'TBD' },
];

// Mock Data for Charts
export const DISTRIBUTION_DATA = [
  { range: '9-12', count: 15 },
  { range: '12-15', count: 45 },
  { range: '15-18', count: 60 },
  { range: '18-21', count: 40 },
  { range: '21-24', count: 25 },
  { range: '24-27', count: 15 },
  { range: '27-30', count: 8 },
  { range: '30+', count: 5 },
];

export const CORRELATION_DATA = Array.from({ length: 50 }, (_, i) => ({
  name: i,
  spx: 4000 + Math.random() * 500 - (i * 10),
  vix: 15 + Math.random() * 10 + (i * 0.2),
}));

export const FUTURES_TERM_STRUCTURE = [
  { month: 'Spot', price: 14.5 },
  { month: 'M1', price: 15.2 },
  { month: 'M2', price: 16.1 },
  { month: 'M3', price: 16.8 },
  { month: 'M4', price: 17.2 },
  { month: 'M5', price: 17.5 },
  { month: 'M6', price: 17.7 },
  { month: 'M7', price: 17.9 },
];