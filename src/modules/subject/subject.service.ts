import { v7 } from "uuid";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import type {
	subjectRequestStatic,
	subjectUpdateRequestStatic,
} from "./subject.dto";
import { subjectRepository } from "./subject.repository";

export const subjectService = {
	async create(userId: string, data: subjectRequestStatic) {
		const newSubject = {
			id: v7(),
			userId,
			name: data.name,
			icon: data.icon,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		await subjectRepository.create(newSubject);

		return newSubject;
	},

	async findAll(userId: string) {
		return await subjectRepository.findAllByUserId(userId);
	},

	async findById(userId: string, subjectId: string) {
		const [subject] = await subjectRepository.findByIdAndUserId(
			subjectId,
			userId,
		);

		if (!subject) {
			throw new NotFoundError("Subject not found");
		}

		return subject;
	},

	async updateById(
		userId: string,
		subjectId: string,
		data: subjectUpdateRequestStatic,
	) {
		const [subject] = await subjectRepository.findByIdAndUserId(
			subjectId,
			userId,
		);

		if (!subject) {
			throw new NotFoundError("Subject not found");
		}

		await subjectRepository.updateByIdAndUserId(subjectId, userId, {
			...data,
			updatedAt: new Date(),
		});

		return {
			id: subject.id,
			userId: subject.userId,
			name: data.name ?? subject.name,
			icon: data.icon ?? subject.icon,
			createdAt: subject.createdAt,
			updatedAt: new Date(),
		};
	},

	async findAllWithNotes(userId: string) {
		const rows = await subjectRepository.findAllWithNotes(userId);

		const groups = new Map<
			string,
			{
				subject: (typeof rows)[number]["subjects"];
				notes: NonNullable<(typeof rows)[number]["notes"]>[];
			}
		>();

		for (const { subjects, notes } of rows) {
			if (!groups.has(subjects.id)) {
				groups.set(subjects.id, { subject: subjects, notes: [] });
			}
			if (notes) {
				groups.get(subjects.id)?.notes.push(notes);
			}
		}

		return Array.from(groups.values()).map(({ subject, notes }) => ({
			...subject,
			notes,
		}));
	},

	async deleteById(userId: string, subjectId: string) {
		const [subject] = await subjectRepository.findByIdAndUserId(
			subjectId,
			userId,
		);

		if (!subject) {
			throw new NotFoundError("Subject not found");
		}

		await subjectRepository.deleteByIdAndUserId(subjectId, userId);
	},
};
