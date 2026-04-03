import Redis from "ioredis";
import { env } from "@/config/env";

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: null,
});

redis.on("connect", () => {
	console.log("REDIS: connect");
});

redis.on("error", (err) => {
	console.log(`REDIS: ${err}`);
});

redis.on("close", () => {
	console.log("REDIS: close");
});
