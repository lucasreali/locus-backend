import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	HOST: z.string().optional(),
	PORT: z.string().optional(),
	BACKEND_URL: z.url(),
	FRONTEND_URL: z.url(),
	DATABASE_URL: z.url().startsWith("postgresql://"),
	REDIS_URL: z.url().startsWith("redis://"),
	RESEND_API_KEY: z.string().startsWith("re_"),
	EMAIL_FROM: z.string(),
	COOKIE_SECRET: z.string(),
	NODE_ENV: z.string().optional(),
});

export const env = envSchema.parse(process.env);
