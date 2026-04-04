import crypto from "node:crypto";
import { createWriteStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { ForbiddenError } from "@/shared/errors/ForbiddenError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { aiQueue } from "./ai.queue";
import { aiRepository } from "./ai.repository";

export const aiService = {
	async upload(data: {
		userId: string;
		stream: NodeJS.ReadableStream;
		fileName: string;
		mimeType: string;
	}) {
		const { userId, stream, fileName, mimeType } = data;

		const tempDir = os.tmpdir();
		const uniqueFilename = `${crypto.randomBytes(16).toString("hex")}.pdf`;
		const filePath = path.join(tempDir, uniqueFilename);

		await pipeline(stream, createWriteStream(filePath));

		const createdStatus = await aiRepository.create({
			userId,
			fileName,
			status: "PENDING",
		});

		await aiQueue.add("process-ai", {
			aiId: createdStatus.id,
			userId,
			filePath,
			mimeType,
		});

		return createdStatus;
	},

	async findById(userId: string, id: string) {
		const aiRecord = await aiRepository.findById(id);
		if (!aiRecord) {
			throw new NotFoundError("AI record not found");
		}
		if (aiRecord.userId !== userId) {
			throw new ForbiddenError("Forbidden");
		}
		return aiRecord;
	},

	async findAllByUserId(userId: string) {
		return await aiRepository.findAllByUserId(userId);
	},

	async deleteById(userId: string, id: string) {
		const aiRecord = await aiRepository.findById(id);
		if (!aiRecord) {
			throw new NotFoundError("AI record not found");
		}
		if (aiRecord.userId !== userId) {
			throw new ForbiddenError("Forbidden");
		}
		await aiRepository.deleteById(id);
	},
};
