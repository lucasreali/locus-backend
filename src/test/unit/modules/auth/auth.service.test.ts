import { redis } from "@/database/redis";
import { accountRepository } from "@/modules/auth/account.repository";
import { authService } from "@/modules/auth/core/auth.service";
import { UnauthorizedError } from "@/shared/errors/UnauthorizedError";
import { compare } from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth/account.repository");
vi.mock("bcrypt");
vi.mock("@/database/redis", () => ({
	redis: {
		get: vi.fn(),
		set: vi.fn(),
		del: vi.fn(),
		smembers: vi.fn(),
		sadd: vi.fn(),
		srem: vi.fn(),
		pipeline: vi.fn(),
	},
}));

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const SESSION_ID = "019746c0-0000-7000-8000-000000000099";

const mockUser = {
	id: USER_ID,
	name: "John Doe",
	email: "john@example.com",
	avatarUrl: null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

const mockAccount = {
	id: "019746c0-0000-7000-8000-000000000010",
	userId: USER_ID,
	password: "hashed_password",
	emailVerified: true,
	accessToken: null as string | null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

const mockPipeline = {
	del: vi.fn().mockReturnThis(),
	exec: vi.fn().mockResolvedValue([]),
};

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(redis.smembers).mockResolvedValue([]);
	vi.mocked(redis.pipeline).mockReturnValue(mockPipeline as never);
});

describe("authService.login", () => {
	it("should return sessionId and user on valid credentials", async () => {
		vi.mocked(accountRepository.findByInfoLoginByUserEmail).mockResolvedValue([
			{ accounts: mockAccount, users: mockUser },
		]);
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(redis.set).mockResolvedValue("OK");
		vi.mocked(redis.sadd).mockResolvedValue(1);

		const result = await authService.login({
			email: "john@example.com",
			password: "password123",
		});

		expect(result.user).toEqual(mockUser);
		expect(result.sessionId).toBeDefined();
		expect(typeof result.sessionId).toBe("string");
	});

	it("should throw UnauthorizedError when user is not found", async () => {
		vi.mocked(accountRepository.findByInfoLoginByUserEmail).mockResolvedValue(
			[],
		);

		await expect(
			authService.login({ email: "ghost@example.com", password: "pass" }),
		).rejects.toThrow(UnauthorizedError);

		await expect(
			authService.login({ email: "ghost@example.com", password: "pass" }),
		).rejects.toThrow("Invalid credentials");
	});

	it("should throw UnauthorizedError when email is not verified", async () => {
		vi.mocked(accountRepository.findByInfoLoginByUserEmail).mockResolvedValue([
			{ accounts: { ...mockAccount, emailVerified: false }, users: mockUser },
		]);

		await expect(
			authService.login({ email: "john@example.com", password: "password123" }),
		).rejects.toThrow(UnauthorizedError);

		await expect(
			authService.login({ email: "john@example.com", password: "password123" }),
		).rejects.toThrow("Please, verify your email first");
	});

	it("should throw UnauthorizedError when password is incorrect", async () => {
		vi.mocked(accountRepository.findByInfoLoginByUserEmail).mockResolvedValue([
			{ accounts: mockAccount, users: mockUser },
		]);
		vi.mocked(compare).mockResolvedValue(false as never);

		await expect(
			authService.login({ email: "john@example.com", password: "wrong" }),
		).rejects.toThrow(UnauthorizedError);
	});

	it("should remove existing sessions before creating a new one", async () => {
		vi.mocked(accountRepository.findByInfoLoginByUserEmail).mockResolvedValue([
			{ accounts: mockAccount, users: mockUser },
		]);
		vi.mocked(compare).mockResolvedValue(true as never);
		vi.mocked(redis.smembers).mockResolvedValue([
			"old-session-1",
			"old-session-2",
		]);
		vi.mocked(redis.set).mockResolvedValue("OK");
		vi.mocked(redis.sadd).mockResolvedValue(1);

		await authService.login({
			email: "john@example.com",
			password: "password123",
		});

		expect(redis.pipeline).toHaveBeenCalled();
		expect(mockPipeline.exec).toHaveBeenCalled();
	});
});

describe("authService.logout", () => {
	it("should delete session and remove from user sessions set", async () => {
		const sessionData = JSON.stringify({ userId: USER_ID });
		vi.mocked(redis.get).mockResolvedValue(sessionData);
		vi.mocked(redis.del).mockResolvedValue(1);
		vi.mocked(redis.srem).mockResolvedValue(1);

		await authService.logout(SESSION_ID);

		expect(redis.del).toHaveBeenCalledWith(`session:${SESSION_ID}`);
		expect(redis.srem).toHaveBeenCalledWith(
			`user:sessions:${USER_ID}`,
			SESSION_ID,
		);
	});

	it("should do nothing when session does not exist", async () => {
		vi.mocked(redis.get).mockResolvedValue(null);

		await authService.logout(SESSION_ID);

		expect(redis.del).not.toHaveBeenCalled();
		expect(redis.srem).not.toHaveBeenCalled();
	});
});

describe("authService.removeAllUserSessions", () => {
	it("should remove all sessions when user has active sessions", async () => {
		vi.mocked(redis.smembers).mockResolvedValue(["session-1", "session-2"]);

		await authService.removeAllUserSessions(USER_ID);

		expect(redis.pipeline).toHaveBeenCalled();
		expect(mockPipeline.del).toHaveBeenCalledTimes(3); // 2 sessions + 1 set key
		expect(mockPipeline.exec).toHaveBeenCalled();
	});

	it("should do nothing when user has no sessions", async () => {
		vi.mocked(redis.smembers).mockResolvedValue([]);

		await authService.removeAllUserSessions(USER_ID);

		expect(redis.pipeline).not.toHaveBeenCalled();
	});
});
