import { redis as connection } from '@/database/redis';
import { geminiService } from '@/shared/services/gemini.service';
import { Worker } from 'bullmq';
import fs from 'node:fs/promises';
import { v7 } from 'uuid';
import { calendarRepository } from '../calendar/calendar.repository';
import { SYLLABUS_QUEUE_NAME } from './ai.queue';
import { syllabusRepository } from './ai.repository';

type CalendarEventType =
    | 'exam'
    | 'assignment'
    | 'project'
    | 'presentation'
    | 'other';

type ExtractedEvent = {
    title?: string;
    description?: string;
    dueDate?: string | null;
    type?: string;
    titulo?: string;
    descricao?: string;
    data?: string | null;
    tipo?: string;
};

type GeminiSyllabusDetails = {
    courseName?: string | null;
    professor?: string | null;
    events?: ExtractedEvent[];
    curso?: string | null;
    eventos?: ExtractedEvent[];
};

type GeminiResult = {
    documentType?: string;
    syllabusDetails?: GeminiSyllabusDetails | null;
    categoria?: string;
    dados_extraidos?: GeminiSyllabusDetails;
};

const normalizeEventType = (value?: string): CalendarEventType => {
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

            const geminiResult = (await geminiService.processSyllabusPdf(
                base64Data,
                mimeType,
            )) as GeminiResult;

            const documentType =
                geminiResult.documentType || geminiResult.categoria || 'OTHER';
            const syllabusDetails =
                geminiResult.syllabusDetails ||
                geminiResult.dados_extraidos ||
                null;

            const extractedEvents =
                syllabusDetails?.events || syllabusDetails?.eventos || [];
            const courseName =
                syllabusDetails?.courseName || syllabusDetails?.curso;
            const professor = syllabusDetails?.professor;

            if (extractedEvents.length === 0) {
                await syllabusRepository.updateById(syllabusId, {
                    status: 'COMPLETED',
                    documentType,
                    courseName,
                    professor,
                    errorMessage: 'No events extracted',
                    rawResponse: JSON.stringify(geminiResult),
                });
                shouldCleanup = true;
                return { success: true, count: 0 };
            }

            const calendarData = extractedEvents
                .map((event) => {
                    const title = event.title || event.titulo;
                    if (!title) return null;

                    return {
                        id: v7(),
                        userId,
                        syllabusId,
                        title,
                        description:
                            event.description || event.descricao || null,
                        dueDate: normalizeDueDate(
                            event.dueDate || event.data || null,
                        ),
                        type: normalizeEventType(event.type || event.tipo),
                        status: 'pending' as const,
                        courseName: courseName || null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                })
                .filter((event) => event !== null);

            await calendarRepository.createMany(calendarData);

            await syllabusRepository.updateById(syllabusId, {
                status: 'COMPLETED',
                documentType,
                courseName,
                professor,
                errorMessage: null,
                rawResponse: JSON.stringify(geminiResult),
            });

            shouldCleanup = true;
            return { success: true, count: calendarData.length };
        } catch (error) {
            const message = getErrorMessage(error);
            const isMissingFile = getErrorCode(error) === 'ENOENT';
            const isLastAttempt =
                isMissingFile || job.attemptsMade + 1 >= attempts;

            console.error(`Syllabus worker error for job ${job.id}:`, error);
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
