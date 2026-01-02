export enum View {
  DISTRIBUTION = 'Distribution',
  CORRELATION = 'Correlation',
  FUTURES = 'Futures',
  TBD1 = 'TBD 1',
  TBD2 = 'TBD 2'
}

export interface ChartDataPoint {
  name: string | number;
  value: number;
  value2?: number;
  amt?: number;
}

export interface NavItem {
  id: View;
  label: string;
}