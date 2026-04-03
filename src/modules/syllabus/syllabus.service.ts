import { ForbiddenError } from "@/shared/errors/ForbiddenError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { syllabusRepository } from "./syllabus.repository";
import { syllabusQueue } from "./syllabus.queue";

class SyllabusService {
    async upload(data: { userId: string, fileName: string, filePath: string, mimeType: string }) {
        const { userId, fileName, filePath, mimeType } = data;
        
        // Save initial state to DB
        const createdStatus = await syllabusRepository.create({
            userId,
            fileName,
            status: "PENDING"
        });

        // Add to bullmq queue
        await syllabusQueue.add("process-syllabus", {
             syllabusId: createdStatus.id,
             userId,
             filePath,
             mimeType
        });

        return createdStatus;
    }

    async findById(id: string) {
        const syllabus = await syllabusRepository.findById(id);
        if (!syllabus) {
             throw new NotFoundError("Syllabus not found");
        }
        return syllabus;
    }

    async findAllByUserId(userId: string) {
        return await syllabusRepository.findAllByUserId(userId);
    }

    async deleteById(userId: string, id: string) {
        const syllabus = await syllabusRepository.findById(id);
        if (!syllabus) {
             throw new NotFoundError("Syllabus not found");
        }

        if (syllabus.userId !== userId) {
             throw new ForbiddenError("Forbidden");
        }

        await syllabusRepository.deleteById(id);
    }
}

export const syllabusService = new SyllabusService();
