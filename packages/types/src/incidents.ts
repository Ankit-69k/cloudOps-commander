import { z } from 'zod';

export const IncidentSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const CreateIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  severity: IncidentSeveritySchema,
  infrastructureId: z.string().uuid(),
  detectedBy: z.enum(['manual', 'monitoring', 'ai-agent']),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type CreateIncidentInput = z.infer<typeof CreateIncidentSchema>;

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  infrastructureId: string;
  detectedBy: 'manual' | 'monitoring' | 'ai-agent';
  resolvedBy?: string;
  context?: Record<string, unknown>;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}
