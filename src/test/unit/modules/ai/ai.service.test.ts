import { aiQueue } from '@/modules/ai/ai.queue';
import { aiRepository } from '@/modules/ai/ai.repository';
import { aiService } from '@/modules/ai/ai.service';
import { ForbiddenError } from '@/shared/errors/ForbiddenError';
import { NotFoundError } from '@/shared/errors/NotFoundError';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/modules/ai/ai.repository', () => ({
    aiRepository: {
        create: vi.fn(),
        findById: vi.fn(),
        findAllByUserId: vi.fn(),
        deleteById: vi.fn(),
    },
}));

vi.mock('@/modules/ai/ai.queue', () => ({
    aiQueue: {
        add: vi.fn(),
    },
}));

vi.mock('node:fs', () => ({
    createWriteStream: vi.fn().mockReturnValue({}),
}));

vi.mock('node:stream/promises', () => ({
    pipeline: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:os', () => ({
    default: { tmpdir: vi.fn().mockReturnValue('/tmp') },
}));

vi.mock('node:crypto', () => ({
    default: {
        randomBytes: vi.fn().mockReturnValue({
            toString: vi.fn().mockReturnValue('aabbccddee112233'),
        }),
    },
}));

const USER_ID = '019746c0-0000-7000-8000-000000000001';
const AI_ID = '019746c0-0000-7000-8000-000000000002';

type AiCreateResult = Awaited<ReturnType<typeof aiRepository.create>>;
type AiFindByIdResult = Awaited<ReturnType<typeof aiRepository.findById>>;
type AiFindAllByUserIdResult = Awaited<
    ReturnType<typeof aiRepository.findAllByUserId>
>;

type MockAiRecord = NonNullable<AiFindByIdResult>;

const mockAiRecord: MockAiRecord = {
    id: AI_ID,
    userId: USER_ID,
    fileName: 'test.pdf',
    documentType: null,
    status: 'COMPLETED',
    errorMessage: null,
    courseName: null,
    professor: null,
    rawResponse: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockStream = {} as NodeJS.ReadableStream;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('aiService.upload', () => {
    it('should create a DB record with PENDING status, enqueue the job, and return the created record', async () => {
        const mockCreated = {
            ...mockAiRecord,
            status: 'PENDING',
        } as AiCreateResult;
        vi.mocked(aiRepository.create).mockResolvedValue(mockCreated);
        vi.mocked(aiQueue.add).mockResolvedValue({} as never);

        const result = await aiService.upload({
            userId: USER_ID,
            stream: mockStream,
            fileName: 'test.pdf',
            mimeType: 'application/pdf',
        });

        expect(aiRepository.create).toHaveBeenCalledOnce();
        expect(aiRepository.create).toHaveBeenCalledWith({
            userId: USER_ID,
            fileName: 'test.pdf',
            status: 'PENDING',
        });

        expect(aiQueue.add).toHaveBeenCalledOnce();
        expect(aiQueue.add).toHaveBeenCalledWith(
            'process-ai',
            expect.objectContaining({
                aiId: AI_ID,
                userId: USER_ID,
                mimeType: 'application/pdf',
            }),
        );

        expect(result).toEqual(mockCreated);
    });
});

describe('aiService.findById', () => {
    it('should return the AI record when found and userId matches', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(mockAiRecord);

        const result = await aiService.findById(USER_ID, AI_ID);

        expect(result).toEqual(mockAiRecord);
        expect(aiRepository.findById).toHaveBeenCalledWith(AI_ID);
    });

    it('should throw NotFoundError when AI record does not exist', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(
            undefined as unknown as AiFindByIdResult,
        );

        await expect(aiService.findById(USER_ID, AI_ID)).rejects.toThrow(
            NotFoundError,
        );
        await expect(aiService.findById(USER_ID, AI_ID)).rejects.toThrow(
            'AI record not found',
        );
    });

    it('should throw ForbiddenError when AI record belongs to another user', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(mockAiRecord);

        await expect(
            aiService.findById('other-user-id', AI_ID),
        ).rejects.toThrow(ForbiddenError);
    });
});

describe('aiService.findAllByUserId', () => {
    it('should return all AI records for the user', async () => {
        vi.mocked(aiRepository.findAllByUserId).mockResolvedValue([
            mockAiRecord,
        ] as AiFindAllByUserIdResult);

        const result = await aiService.findAllByUserId(USER_ID);

        expect(result).toEqual([mockAiRecord]);
        expect(aiRepository.findAllByUserId).toHaveBeenCalledWith(USER_ID);
    });

    it('should return empty array when user has no AI records', async () => {
        vi.mocked(aiRepository.findAllByUserId).mockResolvedValue([]);

        const result = await aiService.findAllByUserId(USER_ID);

        expect(result).toEqual([]);
    });
});

describe('aiService.deleteById', () => {
    it('should delete the AI record when found and userId matches', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(mockAiRecord);
        vi.mocked(aiRepository.deleteById).mockResolvedValue(undefined);

        await expect(
            aiService.deleteById(USER_ID, AI_ID),
        ).resolves.toBeUndefined();

        expect(aiRepository.deleteById).toHaveBeenCalledWith(AI_ID);
    });

    it('should throw NotFoundError when AI record does not exist', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(
            undefined as unknown as AiFindByIdResult,
        );

        await expect(aiService.deleteById(USER_ID, AI_ID)).rejects.toThrow(
            NotFoundError,
        );

        expect(aiRepository.deleteById).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError when AI record belongs to another user', async () => {
        vi.mocked(aiRepository.findById).mockResolvedValue(mockAiRecord);

        await expect(
            aiService.deleteById('other-user-id', AI_ID),
        ).rejects.toThrow(ForbiddenError);

        expect(aiRepository.deleteById).not.toHaveBeenCalled();
    });
});
