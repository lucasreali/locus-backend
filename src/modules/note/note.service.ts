import { subjectRepository } from "@/modules/subject/subject.repository";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { stripUndefined } from "@/shared/utils/strip-undefined";
import { v7 } from "uuid";
import type {
	noteQueryParamsStatic,
	noteRequestStatic,
	noteUpdateRequestStatic,
} from "./note.dto";
import { noteRepository } from "./note.repository";

export const noteService = {
	async create(userId: string, data: noteRequestStatic) {
		if (data.subjectId) {
			const [subject] = await subjectRepository.findByIdAndUserId(
				data.subjectId,
				userId,
			);
			if (!subject) throw new NotFoundError("Subject not found");
		}

		const newNote = {
			id: v7(),
			userId,
			subjectId: data.subjectId ?? null,
			title: data.title,
			content: data.content,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await noteRepository.create(newNote);
		return newNote;
	},

	async findById(userId: string, noteId: string) {
		const [note] = await noteRepository.findById(noteId);
		if (!note || note.userId !== userId) throw new NotFoundError("Note not found");
		return note;
	},

	async findAllByUserId(userId: string, filters: noteQueryParamsStatic) {
		return await noteRepository.findAllByUserId(userId, filters);
	},

	async updateById(
		userId: string,
		noteId: string,
		data: noteUpdateRequestStatic,
	) {
		const [note] = await noteRepository.findById(noteId);

		if (!note || note.userId !== userId) {
			throw new NotFoundError("Note not found");
		}

		if (data.subjectId) {
			const [subject] = await subjectRepository.findByIdAndUserId(
				data.subjectId,
				userId,
			);
			if (!subject) throw new NotFoundError("Subject not found");
		}

		const updatedNote = stripUndefined({
			...data,
			subjectId: data.subjectId !== undefined ? data.subjectId ?? null : undefined,
			updatedAt: new Date(),
		});

		await noteRepository.updateById(noteId, userId, updatedNote);

		return { ...note, ...updatedNote };
	},

	async deleteById(userId: string, noteId: string) {
		const [note] = await noteRepository.findById(noteId);

		if (!note || note.userId !== userId) {
			throw new NotFoundError("Note not found");
		}

		await noteRepository.deleteById(noteId, userId);
	},
};
