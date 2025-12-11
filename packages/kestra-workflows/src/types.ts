import { z } from 'zod';

export const WorkflowExecutionSchema = z.object({
  id: z.string(),
  namespace: z.string(),
  flowId: z.string(),
  state: z.enum(['CREATED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED']),
  startDate: z.string(),
  endDate: z.string().optional(),
  duration: z.number().optional(),
  inputs: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;

export interface WorkflowDefinition {
  id: string;
  namespace: string;
  description?: string;
  inputs?: Array<{
    name: string;
    type: string;
    required?: boolean;
    defaults?: any;
  }>;
  tasks: WorkflowTask[];
  triggers?: WorkflowTrigger[];
}

export interface WorkflowTask {
  id: string;
  type: string;
  description?: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'webhook' | 'event';
  config: Record<string, any>;
}

export interface AIAgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface AIAgentSummary {
  summary: string;
  keyPoints: string[];
  recommendations: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface DataSource {
  name: string;
  type: 'logs' | 'metrics' | 'events' | 'database';
  query?: string;
  filters?: Record<string, any>;
}
