import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventRepository } from "@/modules/event/event.repository";
import { eventService } from "@/modules/event/event.service";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import type { SyllabusEventType } from "@/modules/syllabus/syllabus.prompt";

vi.mock("@/modules/event/event.repository");

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const OTHER_USER_ID = "019746c0-0000-7000-8000-000000000003";
const EVENT_ID = "019746c0-0000-7000-8000-000000000002";

type FindByIdResult = Awaited<ReturnType<typeof eventRepository.findById>>;
type FindByUserIdResult = Awaited<
	ReturnType<typeof eventRepository.findByUserId>
>;
type FindByUserIdAndDateRangeResult = Awaited<
	ReturnType<typeof eventRepository.findByUserIdAndDateRange>
>;

const mockEvent = {
	id: EVENT_ID,
	userId: USER_ID,
	title: "Exam 1",
	description: "Midterm exam",
	dueDate: "2026-05-10",
	type: "exam" as const,
	status: "pending" as const,
	courseName: "Algorithms",
	syllabusId: null,
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("eventService.create", () => {
	it("should create and return a new event", async () => {
		vi.mocked(eventRepository.create).mockResolvedValue(undefined);

		const result = await eventService.create(USER_ID, {
			title: "Exam 1",
			description: "Midterm exam",
			dueDate: "2026-05-10",
			type: "exam",
			status: "pending",
			courseName: "Algorithms",
		});

		expect(result).toMatchObject({
			userId: USER_ID,
			title: "Exam 1",
			description: "Midterm exam",
			dueDate: "2026-05-10",
			type: "exam",
			status: "pending",
			courseName: "Algorithms",
			syllabusId: null,
		});
		expect(result.id).toBeDefined();
		expect(result.createdAt).toBeInstanceOf(Date);
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(eventRepository.create).toHaveBeenCalledOnce();
		expect(eventRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: USER_ID,
				title: "Exam 1",
			}),
		);
	});

	it("should set nullable defaults when optional fields are not provided", async () => {
		vi.mocked(eventRepository.create).mockResolvedValue(undefined);

		const result = await eventService.create(USER_ID, {
			title: "Project delivery",
			type: "project",
		});

		expect(result.description).toBeNull();
		expect(result.dueDate).toBeNull();
		expect(result.courseName).toBeNull();
		expect(result.status).toBe("pending");
	});
});

describe("eventService.findById", () => {
	it("should return the event when found", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			mockEvent,
		] as FindByIdResult);

		const result = await eventService.findById(EVENT_ID);

		expect(result).toEqual(mockEvent);
		expect(eventRepository.findById).toHaveBeenCalledWith(EVENT_ID);
	});

	it("should throw NotFoundError when event does not exist", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(eventService.findById(EVENT_ID)).rejects.toThrow(
			NotFoundError,
		);
		await expect(eventService.findById(EVENT_ID)).rejects.toThrow(
			"Event not found",
		);
	});
});

describe("eventService.findAllByUserId", () => {
	it("should return user events when date filters are not provided", async () => {
		vi.mocked(eventRepository.findByUserId).mockResolvedValue([
			mockEvent,
		] as FindByUserIdResult);

		const result = await eventService.findAllByUserId(USER_ID);

		expect(result).toEqual([mockEvent]);
		expect(eventRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
		expect(eventRepository.findByUserIdAndDateRange).not.toHaveBeenCalled();
	});

	it("should query date range when both startDate and endDate are provided", async () => {
		vi.mocked(eventRepository.findByUserIdAndDateRange).mockResolvedValue([
			mockEvent,
		] as FindByUserIdAndDateRangeResult);

		await eventService.findAllByUserId(USER_ID, "2026-05-01", "2026-05-31");

		expect(eventRepository.findByUserIdAndDateRange).toHaveBeenCalledWith(
			USER_ID,
			expect.any(Date),
			expect.any(Date),
		);

		const [calledStartDate, calledEndDate] = vi
			.mocked(eventRepository.findByUserIdAndDateRange)
			.mock.calls[0].slice(1) as [Date, Date];
		expect(calledStartDate.toISOString()).toContain("2026-05-01");
		expect(calledEndDate.toISOString()).toContain("2026-05-31");
	});
});

describe("eventService.updateById", () => {
	it("should update and return merged event data", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			mockEvent,
		] as FindByIdResult);
		vi.mocked(eventRepository.updateById).mockResolvedValue(undefined);

		const result = await eventService.updateById(USER_ID, EVENT_ID, {
			title: "Exam 1 - Updated",
			status: "completed",
		});

		expect(result).toMatchObject({
			id: EVENT_ID,
			title: "Exam 1 - Updated",
			status: "completed",
		});
		expect(result.updatedAt).toBeInstanceOf(Date);
		expect(eventRepository.updateById).toHaveBeenCalledWith(
			EVENT_ID,
			expect.objectContaining({
				title: "Exam 1 - Updated",
				status: "completed",
			}),
		);
	});

	it("should convert empty dueDate to null", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			mockEvent,
		] as FindByIdResult);
		vi.mocked(eventRepository.updateById).mockResolvedValue(undefined);

		await eventService.updateById(USER_ID, EVENT_ID, {
			dueDate: "",
		});

		expect(eventRepository.updateById).toHaveBeenCalledWith(
			EVENT_ID,
			expect.objectContaining({ dueDate: null }),
		);
	});

	it("should remove undefined fields before updating", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			mockEvent,
		] as FindByIdResult);
		vi.mocked(eventRepository.updateById).mockResolvedValue(undefined);

		await eventService.updateById(USER_ID, EVENT_ID, {
			title: "Exam renamed",
		});

		const callArg = vi.mocked(eventRepository.updateById).mock.calls[0][1];
		expect(callArg).toHaveProperty("title", "Exam renamed");
		expect(callArg).toHaveProperty("updatedAt");
		expect(callArg).not.toHaveProperty("dueDate");
		expect(callArg).not.toHaveProperty("description");
	});

	it("should throw NotFoundError when event does not exist", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(
			eventService.updateById(USER_ID, EVENT_ID, { title: "Ghost" }),
		).rejects.toThrow(NotFoundError);

		expect(eventRepository.updateById).not.toHaveBeenCalled();
	});

	it("should throw NotFoundError when event belongs to another user", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			{ ...mockEvent, userId: OTHER_USER_ID },
		] as FindByIdResult);

		await expect(
			eventService.updateById(USER_ID, EVENT_ID, {
				title: "Forbidden",
			}),
		).rejects.toThrow(NotFoundError);

		expect(eventRepository.updateById).not.toHaveBeenCalled();
	});
});

describe("eventService.createManyFromSyllabus", () => {
	const SYLLABUS_ID = "019746c0-0000-7000-8000-000000000099";

	const mockSyllabusEvents: Array<{
		title: string;
		description: string | null;
		dueDate: string | null;
		type: SyllabusEventType;
		courseName: string | null;
	}> = [
		{
			title: "Midterm Exam",
			description: "Covers chapters 1-5",
			dueDate: "2026-06-01",
			type: "exam",
			courseName: "Algorithms",
		},
		{
			title: "Project Delivery",
			description: null,
			dueDate: null,
			type: "project",
			courseName: "Algorithms",
		},
	];

	it("should create events linked to the syllabusId and return the created records", async () => {
		vi.mocked(eventRepository.createMany).mockResolvedValue(undefined);

		const result = await eventService.createManyFromSyllabus(
			USER_ID,
			SYLLABUS_ID,
			mockSyllabusEvents,
		);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			userId: USER_ID,
			syllabusId: SYLLABUS_ID,
			title: "Midterm Exam",
			type: "exam",
			status: "pending",
			courseName: "Algorithms",
		});
		expect(result[0].id).toBeDefined();
		expect(result[0].createdAt).toBeInstanceOf(Date);
		expect(eventRepository.createMany).toHaveBeenCalledOnce();
		expect(eventRepository.createMany).toHaveBeenCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					userId: USER_ID,
					syllabusId: SYLLABUS_ID,
					title: "Midterm Exam",
				}),
			]),
		);
	});

	it("should return empty array and not call createMany when events list is empty", async () => {
		vi.mocked(eventRepository.createMany).mockResolvedValue(undefined);

		const result = await eventService.createManyFromSyllabus(
			USER_ID,
			SYLLABUS_ID,
			[],
		);

		expect(result).toEqual([]);
		expect(eventRepository.createMany).toHaveBeenCalledWith([]);
	});
});

describe("eventService.deleteById", () => {
	it("should delete event when found and owned by user", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			mockEvent,
		] as FindByIdResult);
		vi.mocked(eventRepository.deleteById).mockResolvedValue(undefined);

		await expect(
			eventService.deleteById(USER_ID, EVENT_ID),
		).resolves.toBeUndefined();

		expect(eventRepository.deleteById).toHaveBeenCalledWith(EVENT_ID);
	});

	it("should throw NotFoundError when event does not exist", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([] as FindByIdResult);

		await expect(eventService.deleteById(USER_ID, EVENT_ID)).rejects.toThrow(
			NotFoundError,
		);

		expect(eventRepository.deleteById).not.toHaveBeenCalled();
	});

	it("should throw NotFoundError when event belongs to another user", async () => {
		vi.mocked(eventRepository.findById).mockResolvedValue([
			{ ...mockEvent, userId: OTHER_USER_ID },
		] as FindByIdResult);

		await expect(eventService.deleteById(USER_ID, EVENT_ID)).rejects.toThrow(
			NotFoundError,
		);

		expect(eventRepository.deleteById).not.toHaveBeenCalled();
	});
});
