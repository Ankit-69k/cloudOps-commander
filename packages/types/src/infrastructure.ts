import { z } from 'zod';
import { CloudProvider, CloudProviderSchema, Status } from './common';

export const InfrastructureTypeSchema = z.enum([
  'compute',
  'database',
  'storage',
  'network',
  'kubernetes',
  'serverless',
]);

export type InfrastructureType = z.infer<typeof InfrastructureTypeSchema>;

export const CreateInfrastructureSchema = z.object({
  name: z.string().min(1).max(255),
  type: InfrastructureTypeSchema,
  provider: CloudProviderSchema,
  region: z.string().min(1),
  config: z.record(z.string(), z.unknown()).default({}),
  tags: z.record(z.string(), z.string()).optional(),
});

export type CreateInfrastructureInput = z.infer<typeof CreateInfrastructureSchema>;

export const UpdateInfrastructureSchema = CreateInfrastructureSchema.partial();

export interface Infrastructure {
  id: string;
  name: string;
  type: InfrastructureType;
  provider: CloudProvider;
  region: string;
  status: Status;
  config: Record<string, unknown>;
  tags?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
