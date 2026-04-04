import { calendarRepository } from '@/modules/calendar/calendar.repository';
import { calendarService } from '@/modules/calendar/calendar.service';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/calendar/calendar.repository');

const USER_ID = '019746c0-0000-7000-8000-000000000001';
const OTHER_USER_ID = '019746c0-0000-7000-8000-000000000003';
const EVENT_ID = '019746c0-0000-7000-8000-000000000002';

type FindByIdResult = Awaited<ReturnType<typeof calendarRepository.findById>>;
type FindByUserIdResult = Awaited<
    ReturnType<typeof calendarRepository.findByUserId>
>;
type FindByUserIdAndDateRangeResult = Awaited<
    ReturnType<typeof calendarRepository.findByUserIdAndDateRange>
>;

const mockEvent = {
    id: EVENT_ID,
    userId: USER_ID,
    title: 'Exam 1',
    description: 'Midterm exam',
    dueDate: '2026-05-10',
    type: 'exam' as const,
    status: 'pending' as const,
    courseName: 'Algorithms',
    syllabusId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('calendarService.create', () => {
    it('should create and return a new calendar event', async () => {
        vi.mocked(calendarRepository.create).mockResolvedValue(undefined);

        const result = await calendarService.create(USER_ID, {
            title: 'Exam 1',
            description: 'Midterm exam',
            dueDate: '2026-05-10',
            type: 'exam',
            status: 'pending',
            courseName: 'Algorithms',
        });

        expect(result).toMatchObject({
            userId: USER_ID,
            title: 'Exam 1',
            description: 'Midterm exam',
            dueDate: '2026-05-10',
            type: 'exam',
            status: 'pending',
            courseName: 'Algorithms',
            syllabusId: null,
        });
        expect(result.id).toBeDefined();
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(calendarRepository.create).toHaveBeenCalledOnce();
        expect(calendarRepository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: USER_ID,
                title: 'Exam 1',
            }),
        );
    });

    it('should set nullable defaults when optional fields are not provided', async () => {
        vi.mocked(calendarRepository.create).mockResolvedValue(undefined);

        const result = await calendarService.create(USER_ID, {
            title: 'Project delivery',
            type: 'project',
        });

        expect(result.description).toBeNull();
        expect(result.dueDate).toBeNull();
        expect(result.courseName).toBeNull();
        expect(result.status).toBe('pending');
    });
});

describe('calendarService.findById', () => {
    it('should return the event when found', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            mockEvent,
        ] as FindByIdResult);

        const result = await calendarService.findById(EVENT_ID);

        expect(result).toEqual(mockEvent);
        expect(calendarRepository.findById).toHaveBeenCalledWith(EVENT_ID);
    });

    it('should throw NotFoundError when event does not exist', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue(
            [] as FindByIdResult,
        );

        await expect(calendarService.findById(EVENT_ID)).rejects.toThrow(
            NotFoundError,
        );
        await expect(calendarService.findById(EVENT_ID)).rejects.toThrow(
            'Calendar event not found',
        );
    });
});

describe('calendarService.findAllByUserId', () => {
    it('should return user events when date filters are not provided', async () => {
        vi.mocked(calendarRepository.findByUserId).mockResolvedValue([
            mockEvent,
        ] as FindByUserIdResult);

        const result = await calendarService.findAllByUserId(USER_ID);

        expect(result).toEqual([mockEvent]);
        expect(calendarRepository.findByUserId).toHaveBeenCalledWith(USER_ID);
        expect(
            calendarRepository.findByUserIdAndDateRange,
        ).not.toHaveBeenCalled();
    });

    it('should query date range when both startDate and endDate are provided', async () => {
        vi.mocked(
            calendarRepository.findByUserIdAndDateRange,
        ).mockResolvedValue([mockEvent] as FindByUserIdAndDateRangeResult);

        await calendarService.findAllByUserId(
            USER_ID,
            '2026-05-01',
            '2026-05-31',
        );

        expect(
            calendarRepository.findByUserIdAndDateRange,
        ).toHaveBeenCalledWith(USER_ID, expect.any(Date), expect.any(Date));

        const [calledStartDate, calledEndDate] = vi
            .mocked(calendarRepository.findByUserIdAndDateRange)
            .mock.calls[0].slice(1) as [Date, Date];
        expect(calledStartDate.toISOString()).toContain('2026-05-01');
        expect(calledEndDate.toISOString()).toContain('2026-05-31');
    });
});

describe('calendarService.updateById', () => {
    it('should update and return merged event data', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            mockEvent,
        ] as FindByIdResult);
        vi.mocked(calendarRepository.updateById).mockResolvedValue(undefined);

        const result = await calendarService.updateById(USER_ID, EVENT_ID, {
            title: 'Exam 1 - Updated',
            status: 'completed',
        });

        expect(result).toMatchObject({
            id: EVENT_ID,
            title: 'Exam 1 - Updated',
            status: 'completed',
        });
        expect(result.updatedAt).toBeInstanceOf(Date);
        expect(calendarRepository.updateById).toHaveBeenCalledWith(
            EVENT_ID,
            expect.objectContaining({
                title: 'Exam 1 - Updated',
                status: 'completed',
            }),
        );
    });

    it('should convert empty dueDate to null', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            mockEvent,
        ] as FindByIdResult);
        vi.mocked(calendarRepository.updateById).mockResolvedValue(undefined);

        await calendarService.updateById(USER_ID, EVENT_ID, {
            dueDate: '',
        });

        expect(calendarRepository.updateById).toHaveBeenCalledWith(
            EVENT_ID,
            expect.objectContaining({ dueDate: null }),
        );
    });

    it('should remove undefined fields before updating', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            mockEvent,
        ] as FindByIdResult);
        vi.mocked(calendarRepository.updateById).mockResolvedValue(undefined);

        await calendarService.updateById(USER_ID, EVENT_ID, {
            title: 'Exam renamed',
        });

        const callArg = vi.mocked(calendarRepository.updateById).mock
            .calls[0][1];
        expect(callArg).toHaveProperty('title', 'Exam renamed');
        expect(callArg).toHaveProperty('updatedAt');
        expect(callArg).not.toHaveProperty('dueDate');
        expect(callArg).not.toHaveProperty('description');
    });

    it('should throw NotFoundError when event does not exist', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue(
            [] as FindByIdResult,
        );

        await expect(
            calendarService.updateById(USER_ID, EVENT_ID, { title: 'Ghost' }),
        ).rejects.toThrow(NotFoundError);

        expect(calendarRepository.updateById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when event belongs to another user', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            { ...mockEvent, userId: OTHER_USER_ID },
        ] as FindByIdResult);

        await expect(
            calendarService.updateById(USER_ID, EVENT_ID, {
                title: 'Forbidden',
            }),
        ).rejects.toThrow(NotFoundError);

        expect(calendarRepository.updateById).not.toHaveBeenCalled();
    });
});

describe('calendarService.deleteById', () => {
    it('should delete event when found and owned by user', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            mockEvent,
        ] as FindByIdResult);
        vi.mocked(calendarRepository.deleteById).mockResolvedValue(undefined);

        await expect(
            calendarService.deleteById(USER_ID, EVENT_ID),
        ).resolves.toBeUndefined();

        expect(calendarRepository.deleteById).toHaveBeenCalledWith(EVENT_ID);
    });

    it('should throw NotFoundError when event does not exist', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue(
            [] as FindByIdResult,
        );

        await expect(
            calendarService.deleteById(USER_ID, EVENT_ID),
        ).rejects.toThrow(NotFoundError);

        expect(calendarRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when event belongs to another user', async () => {
        vi.mocked(calendarRepository.findById).mockResolvedValue([
            { ...mockEvent, userId: OTHER_USER_ID },
        ] as FindByIdResult);

        await expect(
            calendarService.deleteById(USER_ID, EVENT_ID),
        ).rejects.toThrow(NotFoundError);

        expect(calendarRepository.deleteById).not.toHaveBeenCalled();
    });
});
