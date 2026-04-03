import { Worker } from "bullmq";
import { redis as connection } from "@/database/redis";
import { SYLLABUS_QUEUE_NAME } from "./syllabus.queue";
import { geminiService } from "@/shared/services/gemini.service";
import fs from "node:fs/promises";
import { syllabusRepository } from "./syllabus.repository";
import { calendarRepository } from "../calendar/calendar.repository";

export const syllabusWorker = new Worker(
	SYLLABUS_QUEUE_NAME,
	async (job) => {
		const { syllabusId, userId, filePath, mimeType } = job.data;
		
		try {
            await syllabusRepository.updateById(syllabusId, { status: "PROCESSING" });

            // 1. Read the file
			const fileBuffer = await fs.readFile(filePath);
            const base64Data = fileBuffer.toString('base64');

            // 2. Process with AI
            const geminiResult = await geminiService.processSyllabusPdf(base64Data, mimeType);

            if (!geminiResult || !geminiResult.dados_extraidos) {
                throw new Error("No extracted data returned");
            }

            const extractedEvents = geminiResult.dados_extraidos.eventos || [];
            if (extractedEvents.length === 0) {
                 await syllabusRepository.updateById(syllabusId, { 
                    status: "COMPLETED", 
                    documentType: geminiResult.categoria,
                    courseName: geminiResult.dados_extraidos.curso,
                    professor: geminiResult.dados_extraidos.professor,
                    errorMessage: "No events extracted" 
                });
                return { success: true, count: 0 };
            }

            // 3. Map events and save to DB
            const calendarData = extractedEvents.map((e: any) => {
                let startAt = new Date(e.data);
                let endAt = new Date(e.data);
                if (e.hora_inicio) {
                    const [h, m] = e.hora_inicio.split(":");
                    startAt.setHours(parseInt(h), parseInt(m), 0);
                }
                if (e.hora_fim) {
                    const [h, m] = e.hora_fim.split(":");
                    endAt.setHours(parseInt(h), parseInt(m), 0);
                }

                return {
                    userId,
                    title: e.titulo,
                    description: e.descricao || "",
                    startAt,
                    endAt: e.hora_fim ? endAt : startAt,
                    type: e.tipo || "Other"
                };
            });

            // Iterate sequentially or batch insert, using iterate for now
            for (const cdata of calendarData) {
                await calendarRepository.create(cdata);
            }

            // 4. Update status
            await syllabusRepository.updateById(syllabusId, { 
                status: "COMPLETED",
                documentType: geminiResult.categoria,
                courseName: geminiResult.dados_extraidos.curso,
                professor: geminiResult.dados_extraidos.professor,
                rawResponse: JSON.stringify(geminiResult) 
            });

            return { success: true, count: calendarData.length };
		} catch (error: any) {
			console.error(`Syllabus worker error for job ${job.id}:`, error);
            await syllabusRepository.updateById(syllabusId, {
                status: "FAILED",
                errorMessage: error.message || "Unknown error"
            });
			throw error;
		} finally {
            // Cleanup
            try {
                await fs.unlink(filePath);
            } catch (err: any) {
                if (err?.code !== 'ENOENT') {
                    console.error("Failed to delete temp file:", err);
                }
            }
        }
	},
	{ connection },
);
