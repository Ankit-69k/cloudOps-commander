import { z } from 'zod';
import { Status } from './common';

export const WorkflowTypeSchema = z.enum([
  'monitoring',
  'provisioning',
  'scaling',
  'incident-response',
  'backup',
  'deployment',
]);

export type WorkflowType = z.infer<typeof WorkflowTypeSchema>;

export const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  type: WorkflowTypeSchema,
  description: z.string().optional(),
  schedule: z.string().optional(), // cron expression
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().default(true),
});

export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;

export interface Workflow {
  id: string;
  name: string;
  type: WorkflowType;
  description?: string;
  schedule?: string;
  config: Record<string, unknown>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: Status;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  output?: Record<string, unknown>;
}
