import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  AWS_REGION: z.string().default('us-east-1'),
  KESTRA_API_URL: z.string(),
  OUMI_MODEL_ENDPOINT: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  host: env.HOST,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jwtSecret: env.JWT_SECRET,
  corsOrigins: env.CORS_ORIGINS.split(','),
  aws: {
    region: env.AWS_REGION,
  },
  kestra: {
    apiUrl: env.KESTRA_API_URL,
  },
  oumi: {
    modelEndpoint: env.OUMI_MODEL_ENDPOINT,
  },
};
