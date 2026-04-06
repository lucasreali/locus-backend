import crypto from 'node:crypto';
import { createWriteStream } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { syllabusQueue } from './syllabus.queue';
import { syllabusRepository } from './syllabus.repository';

export const syllabusService = {
	async upload(data: {
		userId: string;
		stream: NodeJS.ReadableStream;
		fileName: string;
		mimeType: string;
	}) {
		const { userId, stream, fileName, mimeType } = data;

		const tempDir = os.tmpdir();
		const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}.pdf`;
		const filePath = path.join(tempDir, uniqueFilename);

		await pipeline(stream, createWriteStream(filePath));

		const record = await syllabusRepository.create({
			userId,
			fileName,
			status: 'PENDING',
		});

		await syllabusQueue.add('process-syllabus', {
			syllabusId: record.id,
			userId,
			filePath,
			mimeType,
		});

		return record;
	},

	async findById(userId: string, id: string) {
		const record = await syllabusRepository.findById(id);
		if (!record) {
			throw new NotFoundError('Syllabus record not found');
		}
		if (record.userId !== userId) {
			throw new ForbiddenError('Forbidden');
		}
		return record;
	},

	async findAllByUserId(userId: string) {
		return await syllabusRepository.findAllByUserId(userId);
	},

	async deleteById(userId: string, id: string) {
		const record = await syllabusRepository.findById(id);
		if (!record) {
			throw new NotFoundError('Syllabus record not found');
		}
		if (record.userId !== userId) {
			throw new ForbiddenError('Forbidden');
		}
		await syllabusRepository.deleteById(id);
	},
};
