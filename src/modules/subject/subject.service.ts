import { NotFoundError } from "@/shared/errors/NotFoundError";
import { v7 } from "uuid";
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
			color: data.color,
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
			color: data.color ?? subject.color,
			createdAt: subject.createdAt,
			updatedAt: new Date(),
		};
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
