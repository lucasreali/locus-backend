import { Queue } from "bullmq";
import { redis } from "@/database/redis";

export const mailQueue = new Queue("mailQueue", {
	connection: redis,
	defaultJobOptions: {
		removeOnComplete: true,
	},
});
