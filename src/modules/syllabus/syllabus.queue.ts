import { Queue } from "bullmq";
import { redis as connection } from "@/database/redis";

export const SYLLABUS_QUEUE_NAME = "syllabus-processing";

export const syllabusQueue = new Queue<{
	syllabusId: string;
	userId: string;
	filePath: string;
	mimeType: string;
}>(SYLLABUS_QUEUE_NAME, {
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
