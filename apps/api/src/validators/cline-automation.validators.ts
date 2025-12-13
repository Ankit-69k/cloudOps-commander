import { z } from 'zod';

export const TerraformJobSchema = z.object({
  provider: z.enum(['aws', 'gcp', 'azure']),
  region: z.string(),
  resources: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      config: z.record(z.string(), z.unknown()),
    })
  ),
});

export const KubernetesJobSchema = z.object({
  name: z.string(),
  namespace: z.string().optional(),
  replicas: z.number().optional(),
  image: z.string(),
  port: z.number(),
  host: z.string(),
});

export const DockerJobSchema = z.object({
  baseImage: z.string().optional(),
  nodeVersion: z.string().optional(),
  port: z.number().optional(),
});
