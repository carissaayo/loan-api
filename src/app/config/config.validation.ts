import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().regex(/^\d+$/).transform(Number), // Ensures PORT is a number
  JWT_SECRET: z
    .string()
    .min(10, 'JWT_SECRET is required and must be at least 10 characters long'),
  MONGO_URI: z.string().url('Invalid MongoDB connection URL'),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.string().regex(/^\d+$/).transform(Number).default('6379'),
  PAYSTACK_BASE_URL: z.string().url('Invalid Paystack base URL'),
  PAYSTACK_SECRET: z.string().min(10, 'PAYSTACK_SECRET is required'),
  EMAIL_USERNAME: z
    .string()
    .min(10, 'EMAIL_USERNAME is required for sending mails'),
  EMAIL_PASSWORD: z
    .string()
    .min(10, 'EMAIL_PASSWORD is also required for sending mails'),
  APP_URL: z
    .string()
    .min(10, 'APP_URL is redirecting to verify email')
    .default('http://localhost:3000'),
});

export type EnvVars = z.infer<typeof envSchema>;
