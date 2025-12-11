import { z } from 'zod';

export const ClineTaskSchema = z.object({
  id: z.string(),
  type: z.enum(['terraform', 'kubernetes', 'docker', 'ansible', 'custom']),
  description: z.string(),
  context: z.record(z.string(), z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  timeout: z.number().default(300000).optional(), // 5 minutes default
});

export type ClineTask = z.infer<typeof ClineTaskSchema>;

export interface ClineResponse {
  success: boolean;
  output: string;
  error?: string;
  artifacts?: {
    files: Array<{
      path: string;
      content: string;
      type: string;
    }>;
  };
  duration: number;
}

export interface TerraformConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'digitalocean';
  region: string;
  resources: Array<{
    type: string;
    name: string;
    config: Record<string, unknown>;
  }>;
  variables?: Record<string, unknown>;
  outputs?: string[];
}

export interface KubernetesConfig {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec: Record<string, unknown>;
}

export interface DockerConfig {
  baseImage: string;
  workdir?: string;
  commands: Array<{
    type: 'RUN' | 'COPY' | 'ENV' | 'EXPOSE' | 'CMD' | 'ENTRYPOINT';
    value: string;
  }>;
  ports?: number[];
  env?: Record<string, string>;
}
