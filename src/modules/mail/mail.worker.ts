import { Worker } from "bullmq";
import { redis } from "@/database/redis";
import { mailService } from "./mail.service";

export const mailWorker = new Worker(
	"mailQueue",
	async (job) => {
		console.log(`Processing email job ${job.id}:`, job.data);
		await mailService.sendMail(job.data);
		console.log(`Email job ${job.id} completed successfully`);
	},
	{
		connection: redis,
		concurrency: 5,
	},
);

mailWorker.on("completed", (job) => {
	console.log(`Mail job ${job.id} completed successfully`);
});

mailWorker.on("failed", (job, err) => {
	console.error(`Mail job ${job?.id} failed:`, err);
});

mailWorker.on("error", (err) => {
	console.error("Mail worker error:", err);
});
