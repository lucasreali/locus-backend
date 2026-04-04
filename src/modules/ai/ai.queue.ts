import { Queue } from "bullmq";
import { redis as connection } from "@/database/redis";

export const AI_QUEUE_NAME = "ai-processing";

export const aiQueue = new Queue<{
	aiId: string;
	userId: string;
	filePath: string;
	mimeType: string;
}>(AI_QUEUE_NAME, {
	connection,
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 1000,
		},
		removeOnComplete: true,
		removeOnFail: false,
	},
});
