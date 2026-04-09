import fs from 'node:fs/promises';
import { Worker } from 'bullmq';
import { redis as connection } from '@/database/redis';
import { geminiService } from '@/shared/services/gemini.service';
import { eventService } from '../event/event.service';
import {
	syllabusExtractionPrompt,
	syllabusExtractionSchema,
	type SyllabusEventType,
	type SyllabusExtractionResult,
} from './syllabus.prompt';
import { SYLLABUS_QUEUE_NAME } from './syllabus.queue';
import { syllabusRepository } from './syllabus.repository';

const normalizeEventType = (value?: string): SyllabusEventType => {
	switch ((value || '').trim().toLowerCase()) {
		case 'exam':
			return 'exam';
		case 'assignment':
			return 'assignment';
		case 'project':
			return 'project';
		case 'presentation':
			return 'presentation';
		default:
			return 'other';
	}
};

const normalizeDueDate = (value?: string | null) => {
	if (!value) return null;
	return value.includes('T') ? value.split('T')[0] : value;
};

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error && error.message) {
		return error.message;
	}
	return 'Unknown error';
};

const getErrorCode = (error: unknown) => {
	if (typeof error === 'object' && error !== null && 'code' in error) {
		const code = (error as { code?: unknown }).code;
		return typeof code === 'string' ? code : undefined;
	}
	return undefined;
};

export const syllabusWorker = new Worker(
	SYLLABUS_QUEUE_NAME,
	async (job) => {
		const { syllabusId, userId, filePath, mimeType } = job.data;
		const attempts = job.opts.attempts ?? 1;
		let shouldCleanup = false;

		try {
			await syllabusRepository.updateById(syllabusId, {
				status: 'PROCESSING',
			});

			const fileBuffer = await fs.readFile(filePath);
			const base64Data = fileBuffer.toString('base64');

			const result = (await geminiService.extractFromDocument(
				base64Data,
				mimeType,
				syllabusExtractionPrompt,
				syllabusExtractionSchema,
			)) as SyllabusExtractionResult;

			const documentType = result.documentType || 'OTHER';
			const details = result.syllabusDetails ?? null;
			const extractedEvents = details?.events ?? [];
			const courseName = details?.courseName ?? null;
			const professor = details?.professor ?? null;

			if (extractedEvents.length === 0) {
				await syllabusRepository.updateById(syllabusId, {
					status: 'COMPLETED',
					documentType,
					courseName,
					professor,
					errorMessage: 'No events extracted',
					rawResponse: JSON.stringify(result),
				});
				shouldCleanup = true;
				return { success: true, count: 0 };
			}

			const normalizedEvents = extractedEvents
				.filter((event) => !!event.title)
				.map((event) => ({
					title: event.title,
					description: event.description || null,
					dueDate: normalizeDueDate(event.dueDate),
					type: normalizeEventType(event.type),
					courseName,
				}));

			// Events are NOT auto-created here — the frontend will show them
			// for user approval and call POST /events for each approved event.

			await syllabusRepository.updateById(syllabusId, {
				status: 'COMPLETED',
				documentType,
				courseName,
				professor,
				errorMessage: null,
				rawResponse: JSON.stringify(result),
			});

			shouldCleanup = true;
			return { success: true, count: normalizedEvents.length };
		} catch (error) {
			const message = getErrorMessage(error);
			const isMissingFile = getErrorCode(error) === 'ENOENT';
			const isLastAttempt = isMissingFile || job.attemptsMade + 1 >= attempts;

			console.error(`syllabus worker error for job ${job.id}:`, error);
			await syllabusRepository.updateById(syllabusId, {
				status: isLastAttempt ? 'FAILED' : 'PENDING',
				errorMessage: message,
			});

			if (isLastAttempt) {
				shouldCleanup = true;
			}

			throw error;
		} finally {
			if (shouldCleanup) {
				try {
					await fs.unlink(filePath);
				} catch (error) {
					if (getErrorCode(error) !== 'ENOENT') {
						console.error('Failed to delete temp file:', error);
					}
				}
			}
		}
	},
	{ connection },
);
