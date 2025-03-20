import { envSchema, EnvVars } from './config.validation';

export default () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1); // Stop the app if validation fails
  }

  const env: EnvVars = parsed.data;

  return {
    port: env.PORT,
    jwtSecret: env.JWT_SECRET,
    mongoUri: env.MONGO_URI,
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    paystack: {
      baseUrl: env.PAYSTACK_BASE_URL,
      secret: env.PAYSTACK_SECRET,
    },
    email: {
      username: env.EMAIL_USERNAME,
      password: env.EMAIL_PASSWORD,
    },
    app_url: env.APP_URL,
  };
};
