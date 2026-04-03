import { NotFoundError } from "@/shared/errors/NotFoundError";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { subjectRepository } from "@/modules/subject/subject.repository";
import { subjectService } from "@/modules/subject/subject.service";

vi.mock("@/modules/subject/subject.repository");

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const SUBJECT_ID = "019746c0-0000-7000-8000-000000000002";

const mockSubject = {
	id: SUBJECT_ID,
	userId: USER_ID,
	name: "Mathematics",
	color: "#FF5733",
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("subjectService.create", () => {
	it("should create and return a new subject", async () => {
		vi.mocked(subjectRepository.create).mockResolvedValue(undefined);

		const result = await subjectService.create(USER_ID, {
			name: "Mathematics",
			color: "#FF5733",
		});

		expect(result).toMatchObject({
			userId: USER_ID,
			name: "Mathematics",
			color: "#FF5733",
		});
		expect(result.id).toBeDefined();
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(subjectRepository.create).toHaveBeenCalledOnce();
		expect(subjectRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: USER_ID,
				name: "Mathematics",
				color: "#FF5733",
			}),
		);
	});
});

describe("subjectService.findAll", () => {
	it("should return all subjects for the user", async () => {
		vi.mocked(subjectRepository.findAllByUserId).mockResolvedValue([
			mockSubject,
		]);

		const result = await subjectService.findAll(USER_ID);

		expect(result).toEqual([mockSubject]);
		expect(subjectRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
	});

	it("should return empty array when user has no subjects", async () => {
		vi.mocked(subjectRepository.findAllByUserId).mockResolvedValue([]);

		const result = await subjectService.findAll(USER_ID);

		expect(result).toEqual([]);
	});
});

describe("subjectService.findById", () => {
	it("should return the subject when found", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);

		const result = await subjectService.findById(USER_ID, SUBJECT_ID);

		expect(result).toEqual(mockSubject);
		expect(subjectRepository.findByIdAndUserId).toHaveBeenCalledWith(
			SUBJECT_ID,
			USER_ID,
		);
	});

	it("should throw NotFoundError when subject does not exist", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([]);

		await expect(subjectService.findById(USER_ID, SUBJECT_ID)).rejects.toThrow(
			NotFoundError,
		);

		await expect(subjectService.findById(USER_ID, SUBJECT_ID)).rejects.toThrow(
			"Subject not found",
		);
	});

	it("should throw NotFoundError when subject belongs to another user", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([]);

		await expect(
			subjectService.findById("other-user-id", SUBJECT_ID),
		).rejects.toThrow(NotFoundError);
	});
});

describe("subjectService.updateById", () => {
	it("should update name and color when both are provided", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);
		vi.mocked(subjectRepository.updateByIdAndUserId).mockResolvedValue(
			undefined,
		);

		const result = await subjectService.updateById(USER_ID, SUBJECT_ID, {
			name: "Physics",
			color: "#00FF00",
		});

		expect(result).toMatchObject({
			id: SUBJECT_ID,
			userId: USER_ID,
			name: "Physics",
			color: "#00FF00",
		});
		expect(result.updatedAt).toBeInstanceOf(Date);
	});

	it("should keep original color when only name is updated", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);
		vi.mocked(subjectRepository.updateByIdAndUserId).mockResolvedValue(
			undefined,
		);

		const result = await subjectService.updateById(USER_ID, SUBJECT_ID, {
			name: "Physics",
		});

		expect(result).toMatchObject({
			name: "Physics",
			color: mockSubject.color,
		});
	});

	it("should keep original name when only color is updated", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);
		vi.mocked(subjectRepository.updateByIdAndUserId).mockResolvedValue(
			undefined,
		);

		const result = await subjectService.updateById(USER_ID, SUBJECT_ID, {
			color: "#0000FF",
		});

		expect(result).toMatchObject({
			name: mockSubject.name,
			color: "#0000FF",
		});
	});

	it("should call updateByIdAndUserId without undefined fields", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);
		vi.mocked(subjectRepository.updateByIdAndUserId).mockResolvedValue(
			undefined,
		);

		await subjectService.updateById(USER_ID, SUBJECT_ID, { name: "Physics" });

		const callArg = vi.mocked(subjectRepository.updateByIdAndUserId).mock
			.calls[0][2];
		expect(callArg).not.toHaveProperty("color");
		expect(callArg).toHaveProperty("name", "Physics");
		expect(callArg).toHaveProperty("updatedAt");
	});

	it("should throw NotFoundError when subject does not exist", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([]);

		await expect(
			subjectService.updateById(USER_ID, SUBJECT_ID, { name: "Physics" }),
		).rejects.toThrow(NotFoundError);

		expect(subjectRepository.updateByIdAndUserId).not.toHaveBeenCalled();
	});
});

describe("subjectService.deleteById", () => {
	it("should delete the subject when found", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		]);
		vi.mocked(subjectRepository.deleteByIdAndUserId).mockResolvedValue(
			undefined,
		);

		await expect(
			subjectService.deleteById(USER_ID, SUBJECT_ID),
		).resolves.toBeUndefined();

		expect(subjectRepository.deleteByIdAndUserId).toHaveBeenCalledWith(
			SUBJECT_ID,
			USER_ID,
		);
	});

	it("should throw NotFoundError when subject does not exist", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([]);

		await expect(
			subjectService.deleteById(USER_ID, SUBJECT_ID),
		).rejects.toThrow(NotFoundError);

		expect(subjectRepository.deleteByIdAndUserId).not.toHaveBeenCalled();
	});
});
