export interface AnalyticsData {
  total: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  range: string;
}

export interface TimelineDataPoint {
  date: string;
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
}

export interface TimelineData {
  data: TimelineDataPoint[];
  range: string;
  groupBy: string;
}

export type CardColor = 'green' | 'blue' | 'red' | 'orange';

export interface RateCardProps {
  title: string;
  value: number;
  subtitle: string;
  color: CardColor;
  inverted?: boolean;
}

export interface SkeletonCardProps {
  title: string;
  color: CardColor;
}

export interface BarChartProps {
  data: TimelineDataPoint[];
}
