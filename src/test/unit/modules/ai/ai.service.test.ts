import { ForbiddenError } from "@/shared/errors/ForbiddenError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { syllabusQueue } from "@/modules/ai/ai.queue";
import { syllabusRepository } from "@/modules/ai/ai.repository";
import { syllabusService } from "@/modules/ai/ai.service";

vi.mock("@/modules/ai/ai.repository", () => ({
	syllabusRepository: {
		create: vi.fn(),
		findById: vi.fn(),
		findAllByUserId: vi.fn(),
		deleteById: vi.fn(),
	},
}));
vi.mock("@/modules/ai/ai.queue", () => ({
	syllabusQueue: {
		add: vi.fn(),
	},
}));
vi.mock("node:fs", () => ({
	createWriteStream: vi.fn().mockReturnValue({}),
}));
vi.mock("node:stream/promises", () => ({
	pipeline: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("node:os", () => ({
	default: { tmpdir: vi.fn().mockReturnValue("/tmp") },
}));
vi.mock("node:crypto", () => ({
	default: {
		randomBytes: vi.fn().mockReturnValue({
			toString: vi.fn().mockReturnValue("aabbccddee112233"),
		}),
	},
}));

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const SYLLABUS_ID = "019746c0-0000-7000-8000-000000000002";

const mockSyllabus = {
	id: SYLLABUS_ID,
	userId: USER_ID,
	fileName: "test.pdf",
	documentType: null,
	status: "COMPLETED",
	errorMessage: null,
	courseName: null,
	professor: null,
	rawResponse: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

const mockStream = {} as NodeJS.ReadableStream;

beforeEach(() => {
	vi.clearAllMocks();
});

describe("syllabusService.upload", () => {
	it("should create a DB record with PENDING status, enqueue the job, and return the created record", async () => {
		const mockCreated = { ...mockSyllabus, status: "PENDING" };
		vi.mocked(syllabusRepository.create).mockResolvedValue(mockCreated as any);
		vi.mocked(syllabusQueue.add).mockResolvedValue(undefined as any);

		const result = await syllabusService.upload({
			userId: USER_ID,
			stream: mockStream,
			fileName: "test.pdf",
			mimeType: "application/pdf",
		});

		expect(syllabusRepository.create).toHaveBeenCalledOnce();
		expect(syllabusRepository.create).toHaveBeenCalledWith({
			userId: USER_ID,
			fileName: "test.pdf",
			status: "PENDING",
		});

		expect(syllabusQueue.add).toHaveBeenCalledOnce();
		expect(syllabusQueue.add).toHaveBeenCalledWith(
			"process-syllabus",
			expect.objectContaining({
				syllabusId: SYLLABUS_ID,
				userId: USER_ID,
				mimeType: "application/pdf",
			}),
		);

		expect(result).toEqual(mockCreated);
	});
});

describe("syllabusService.findById", () => {
	it("should return the syllabus when found and userId matches", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(
			mockSyllabus as any,
		);

		const result = await syllabusService.findById(USER_ID, SYLLABUS_ID);

		expect(result).toEqual(mockSyllabus);
		expect(syllabusRepository.findById).toHaveBeenCalledWith(SYLLABUS_ID);
	});

	it("should throw NotFoundError when syllabus does not exist", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(undefined as any);

		await expect(
			syllabusService.findById(USER_ID, SYLLABUS_ID),
		).rejects.toThrow(NotFoundError);
		await expect(
			syllabusService.findById(USER_ID, SYLLABUS_ID),
		).rejects.toThrow("Syllabus not found");
	});

	it("should throw ForbiddenError when syllabus belongs to another user", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(
			mockSyllabus as any,
		);

		await expect(
			syllabusService.findById("other-user-id", SYLLABUS_ID),
		).rejects.toThrow(ForbiddenError);
	});
});

describe("syllabusService.findAllByUserId", () => {
	it("should return all syllabi for the user", async () => {
		vi.mocked(syllabusRepository.findAllByUserId).mockResolvedValue([
			mockSyllabus as any,
		]);

		const result = await syllabusService.findAllByUserId(USER_ID);

		expect(result).toEqual([mockSyllabus]);
		expect(syllabusRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
	});

	it("should return empty array when user has no syllabi", async () => {
		vi.mocked(syllabusRepository.findAllByUserId).mockResolvedValue([]);

		const result = await syllabusService.findAllByUserId(USER_ID);

		expect(result).toEqual([]);
	});
});

describe("syllabusService.deleteById", () => {
	it("should delete the syllabus when found and userId matches", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(
			mockSyllabus as any,
		);
		vi.mocked(syllabusRepository.deleteById).mockResolvedValue(undefined);

		await expect(
			syllabusService.deleteById(USER_ID, SYLLABUS_ID),
		).resolves.toBeUndefined();

		expect(syllabusRepository.deleteById).toHaveBeenCalledWith(SYLLABUS_ID);
	});

	it("should throw NotFoundError when syllabus does not exist", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(undefined as any);

		await expect(
			syllabusService.deleteById(USER_ID, SYLLABUS_ID),
		).rejects.toThrow(NotFoundError);

		expect(syllabusRepository.deleteById).not.toHaveBeenCalled();
	});

	it("should throw ForbiddenError when syllabus belongs to another user", async () => {
		vi.mocked(syllabusRepository.findById).mockResolvedValue(
			mockSyllabus as any,
		);

		await expect(
			syllabusService.deleteById("other-user-id", SYLLABUS_ID),
		).rejects.toThrow(ForbiddenError);

		expect(syllabusRepository.deleteById).not.toHaveBeenCalled();
	});
});
