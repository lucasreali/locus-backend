import { beforeEach, describe, expect, it, vi } from "vitest";
import { noteRepository } from "@/modules/note/note.repository";
import { noteService } from "@/modules/note/note.service";
import { subjectRepository } from "@/modules/subject/subject.repository";
import { NotFoundError } from "@/shared/errors/NotFoundError";

type FindAllGroupedResult = Awaited<
	ReturnType<typeof noteRepository.findAllGroupedBySubject>
>;

vi.mock("@/modules/note/note.repository");
vi.mock("@/modules/subject/subject.repository");

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const OTHER_USER_ID = "019746c0-0000-7000-8000-000000000003";
const NOTE_ID = "019746c0-0000-7000-8000-000000000002";
const SUBJECT_ID = "019746c0-0000-7000-8000-000000000004";

type FindByIdResult = Awaited<ReturnType<typeof noteRepository.findById>>;
type FindAllResult = Awaited<ReturnType<typeof noteRepository.findAllByUserId>>;
type FindSubjectResult = Awaited<
	ReturnType<typeof subjectRepository.findByIdAndUserId>
>;

const mockNote = {
	id: NOTE_ID,
	userId: USER_ID,
	subjectId: null,
	title: "My First Note",
	content: "<p>Hello world</p>",
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const mockSubject = {
	id: SUBJECT_ID,
	userId: USER_ID,
	name: "Mathematics",
	icon: "Calculator",
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("noteService.create", () => {
	it("should create and return a new note without subjectId", async () => {
		vi.mocked(noteRepository.create).mockResolvedValue(undefined);

		const result = await noteService.create(USER_ID, {
			title: "My First Note",
			content: "<p>Hello world</p>",
		});

		expect(result).toMatchObject({
			userId: USER_ID,
			title: "My First Note",
			content: "<p>Hello world</p>",
			subjectId: null,
		});
		expect(result.id).toBeDefined();
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(noteRepository.create).toHaveBeenCalledOnce();
		expect(noteRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: USER_ID,
				title: "My First Note",
				content: "<p>Hello world</p>",
				subjectId: null,
			}),
		);
	});

	it("should create a note linked to a valid subject", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		] as FindSubjectResult);
		vi.mocked(noteRepository.create).mockResolvedValue(undefined);

		const result = await noteService.create(USER_ID, {
			title: "Math Notes",
			content: "<p>Integrals</p>",
			subjectId: SUBJECT_ID,
		});

		expect(result).toMatchObject({
			userId: USER_ID,
			subjectId: SUBJECT_ID,
		});
		expect(subjectRepository.findByIdAndUserId).toHaveBeenCalledWith(
			SUBJECT_ID,
			USER_ID,
		);
		expect(noteRepository.create).toHaveBeenCalledOnce();
	});

	it("should throw NotFoundError when subjectId does not exist or belong to user", async () => {
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue(
			[] as FindSubjectResult,
		);

		await expect(
			noteService.create(USER_ID, {
				title: "Math Notes",
				content: "<p>Integrals</p>",
				subjectId: SUBJECT_ID,
			}),
		).rejects.toThrow(NotFoundError);

		await expect(
			noteService.create(USER_ID, {
				title: "Math Notes",
				content: "<p>Integrals</p>",
				subjectId: SUBJECT_ID,
			}),
		).rejects.toThrow("Subject not found");

		expect(noteRepository.create).not.toHaveBeenCalled();
	});

	it("should not validate subjectId when it is not provided", async () => {
		vi.mocked(noteRepository.create).mockResolvedValue(undefined);

		await noteService.create(USER_ID, {
			title: "Free note",
			content: "<p>No subject</p>",
		});

		expect(subjectRepository.findByIdAndUserId).not.toHaveBeenCalled();
	});
});

describe("noteService.findById", () => {
	it("should return the note when found and owned by user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);

		const result = await noteService.findById(USER_ID, NOTE_ID);

		expect(result).toEqual(mockNote);
		expect(noteRepository.findById).toHaveBeenCalledWith(NOTE_ID);
	});

	it("should throw NotFoundError when note does not exist", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(noteService.findById(USER_ID, NOTE_ID)).rejects.toThrow(
			NotFoundError,
		);
		await expect(noteService.findById(USER_ID, NOTE_ID)).rejects.toThrow(
			"Note not found",
		);
	});

	it("should throw NotFoundError when note belongs to another user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			{ ...mockNote, userId: OTHER_USER_ID },
		] as FindByIdResult);

		await expect(noteService.findById(USER_ID, NOTE_ID)).rejects.toThrow(
			NotFoundError,
		);
	});
});

describe("noteService.findAllByUserId", () => {
	it("should return all notes for the user with no filters", async () => {
		vi.mocked(noteRepository.findAllByUserId).mockResolvedValue([
			mockNote,
		] as FindAllResult);

		const filters = { limit: 50, offset: 0 };
		const result = await noteService.findAllByUserId(USER_ID, filters);

		expect(result).toEqual([mockNote]);
		expect(noteRepository.findAllByUserId).toHaveBeenCalledWith(
			USER_ID,
			filters,
		);
	});

	it("should return empty array when user has no notes", async () => {
		vi.mocked(noteRepository.findAllByUserId).mockResolvedValue(
			[] as FindAllResult,
		);

		const result = await noteService.findAllByUserId(USER_ID, {
			limit: 50,
			offset: 0,
		});

		expect(result).toEqual([]);
	});

	it("should forward subjectId filter to repository", async () => {
		vi.mocked(noteRepository.findAllByUserId).mockResolvedValue([
			mockNote,
		] as FindAllResult);

		const filters = { subjectId: SUBJECT_ID, limit: 50, offset: 0 };
		await noteService.findAllByUserId(USER_ID, filters);

		expect(noteRepository.findAllByUserId).toHaveBeenCalledWith(
			USER_ID,
			filters,
		);
	});

	it("should forward search filter to repository", async () => {
		vi.mocked(noteRepository.findAllByUserId).mockResolvedValue([
			mockNote,
		] as FindAllResult);

		const filters = { search: "first", limit: 50, offset: 0 };
		await noteService.findAllByUserId(USER_ID, filters);

		expect(noteRepository.findAllByUserId).toHaveBeenCalledWith(
			USER_ID,
			filters,
		);
	});
});

describe("noteService.updateById", () => {
	it("should update and return merged note data", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);
		vi.mocked(noteRepository.updateById).mockResolvedValue(undefined);

		const result = await noteService.updateById(USER_ID, NOTE_ID, {
			title: "Updated Title",
		});

		expect(result).toMatchObject({
			id: NOTE_ID,
			title: "Updated Title",
			content: mockNote.content,
		});
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(noteRepository.updateById).toHaveBeenCalledWith(
			NOTE_ID,
			USER_ID,
			expect.objectContaining({ title: "Updated Title" }),
		);
	});

	it("should validate subjectId when updating to a new subject", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue([
			mockSubject,
		] as FindSubjectResult);
		vi.mocked(noteRepository.updateById).mockResolvedValue(undefined);

		await noteService.updateById(USER_ID, NOTE_ID, { subjectId: SUBJECT_ID });

		expect(subjectRepository.findByIdAndUserId).toHaveBeenCalledWith(
			SUBJECT_ID,
			USER_ID,
		);
	});

	it("should throw NotFoundError when new subjectId does not belong to user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);
		vi.mocked(subjectRepository.findByIdAndUserId).mockResolvedValue(
			[] as FindSubjectResult,
		);

		await expect(
			noteService.updateById(USER_ID, NOTE_ID, { subjectId: SUBJECT_ID }),
		).rejects.toThrow(NotFoundError);

		expect(noteRepository.updateById).not.toHaveBeenCalled();
	});

	it("should convert null subjectId to null in the update payload", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			{ ...mockNote, subjectId: SUBJECT_ID },
		] as FindByIdResult);
		vi.mocked(noteRepository.updateById).mockResolvedValue(undefined);

		await noteService.updateById(USER_ID, NOTE_ID, { subjectId: null });

		expect(noteRepository.updateById).toHaveBeenCalledWith(
			NOTE_ID,
			USER_ID,
			expect.objectContaining({ subjectId: null }),
		);
		expect(subjectRepository.findByIdAndUserId).not.toHaveBeenCalled();
	});

	it("should remove undefined fields before updating", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);
		vi.mocked(noteRepository.updateById).mockResolvedValue(undefined);

		await noteService.updateById(USER_ID, NOTE_ID, { title: "New Title" });

		const callArg = vi.mocked(noteRepository.updateById).mock.calls[0][2];
		expect(callArg).toHaveProperty("title", "New Title");
		expect(callArg).toHaveProperty("updatedAt");
		expect(callArg).not.toHaveProperty("content");
		expect(callArg).not.toHaveProperty("subjectId");
	});

	it("should throw NotFoundError when note does not exist", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(
			noteService.updateById(USER_ID, NOTE_ID, { title: "Ghost" }),
		).rejects.toThrow(NotFoundError);

		expect(noteRepository.updateById).not.toHaveBeenCalled();
	});

	it("should throw NotFoundError when note belongs to another user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			{ ...mockNote, userId: OTHER_USER_ID },
		] as FindByIdResult);

		await expect(
			noteService.updateById(USER_ID, NOTE_ID, { title: "Forbidden" }),
		).rejects.toThrow(NotFoundError);

		expect(noteRepository.updateById).not.toHaveBeenCalled();
	});
});

describe("noteService.findAllGroupedBySubject", () => {
	const mockNoteWithSubject = { ...mockNote, subjectId: SUBJECT_ID };
	const mockNoteWithoutSubject = { ...mockNote, subjectId: null };

	it("should return notes grouped by subject including null group", async () => {
		vi.mocked(noteRepository.findAllGroupedBySubject).mockResolvedValue([
			{ notes: mockNoteWithSubject, subjects: mockSubject },
			{ notes: mockNoteWithoutSubject, subjects: null },
		] as FindAllGroupedResult);

		const result = await noteService.findAllGroupedBySubject(USER_ID);

		expect(result).toHaveLength(2);

		const withSubject = result.find((g) => g.subject !== null);
		expect(withSubject?.subject).toEqual({
			id: SUBJECT_ID,
			name: mockSubject.name,
			icon: mockSubject.icon,
		});
		expect(withSubject?.notes).toHaveLength(1);
		expect(withSubject?.notes[0].id).toBe(NOTE_ID);

		const withoutSubject = result.find((g) => g.subject === null);
		expect(withoutSubject?.notes).toHaveLength(1);
	});

	it("should return empty array when user has no notes", async () => {
		vi.mocked(noteRepository.findAllGroupedBySubject).mockResolvedValue(
			[] as FindAllGroupedResult,
		);

		const result = await noteService.findAllGroupedBySubject(USER_ID);

		expect(result).toEqual([]);
	});

	it("should group multiple notes under the same subject", async () => {
		const anotherNote = {
			...mockNote,
			id: "019746c0-0000-7000-8000-000000000099",
			subjectId: SUBJECT_ID,
		};

		vi.mocked(noteRepository.findAllGroupedBySubject).mockResolvedValue([
			{ notes: mockNoteWithSubject, subjects: mockSubject },
			{ notes: anotherNote, subjects: mockSubject },
		] as FindAllGroupedResult);

		const result = await noteService.findAllGroupedBySubject(USER_ID);

		expect(result).toHaveLength(1);
		expect(result[0].notes).toHaveLength(2);
	});

	it("should call repository with correct userId", async () => {
		vi.mocked(noteRepository.findAllGroupedBySubject).mockResolvedValue(
			[] as FindAllGroupedResult,
		);

		await noteService.findAllGroupedBySubject(USER_ID);

		expect(noteRepository.findAllGroupedBySubject).toHaveBeenCalledWith(
			USER_ID,
		);
	});
});

describe("noteService.deleteById", () => {
	it("should delete note when found and owned by user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			mockNote,
		] as FindByIdResult);
		vi.mocked(noteRepository.deleteById).mockResolvedValue(undefined);

		await expect(
			noteService.deleteById(USER_ID, NOTE_ID),
		).resolves.toBeUndefined();

		expect(noteRepository.deleteById).toHaveBeenCalledWith(NOTE_ID, USER_ID);
	});

	it("should throw NotFoundError when note does not exist", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(noteService.deleteById(USER_ID, NOTE_ID)).rejects.toThrow(
			NotFoundError,
		);

		expect(noteRepository.deleteById).not.toHaveBeenCalled();
	});

	it("should throw NotFoundError when note belongs to another user", async () => {
		vi.mocked(noteRepository.findById).mockResolvedValue([
			{ ...mockNote, userId: OTHER_USER_ID },
		] as FindByIdResult);

		await expect(noteService.deleteById(USER_ID, NOTE_ID)).rejects.toThrow(
			NotFoundError,
		);

		expect(noteRepository.deleteById).not.toHaveBeenCalled();
	});
});
