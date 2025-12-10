import { z } from 'zod';

export const MetricTypeSchema = z.enum([
  'cpu',
  'memory',
  'disk',
  'network',
  'requests',
  'errors',
  'latency',
  'custom',
]);

export type MetricType = z.infer<typeof MetricTypeSchema>;

export const CreateMetricSchema = z.object({
  infrastructureId: z.string().uuid(),
  type: MetricTypeSchema,
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  tags: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.date().optional(),
});

export type CreateMetricInput = z.infer<typeof CreateMetricSchema>;

export interface Metric {
  id: string;
  infrastructureId: string;
  type: MetricType;
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface MetricsQuery {
  infrastructureId?: string;
  type?: MetricType;
  startTime: Date;
  endTime: Date;
  interval?: string; // e.g., '5m', '1h', '1d'
}
