import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const CloudProviderSchema = z.enum(['aws', 'gcp', 'azure', 'digitalocean']);
export type CloudProvider = z.infer<typeof CloudProviderSchema>;

export const StatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);
export type Status = z.infer<typeof StatusSchema>;

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}
