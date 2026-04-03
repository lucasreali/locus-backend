import { accountRepository } from "@/modules/auth/account.repository";
import { authService } from "@/modules/auth/core/auth.service";
import { emailVerificationService } from "@/modules/auth/email-verification/email-verification.service";
import { userRepository } from "@/modules/user/user.repository";
import { userService } from "@/modules/user/user.service";
import { ConflictError } from "@/shared/errors/ConflictError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { hash } from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/user/user.repository");
vi.mock("@/modules/auth/account.repository");
vi.mock("@/modules/auth/core/auth.service");
vi.mock("@/modules/auth/email-verification/email-verification.service");
vi.mock("bcrypt");

const USER_ID = "019746c0-0000-7000-8000-000000000001";

const mockUser = {
	id: USER_ID,
	name: "John Doe",
	email: "john@example.com",
	avatarUrl: null as string | null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("userService.create", () => {
	it("should create user, account and send verification email", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([]);
		vi.mocked(userRepository.create).mockResolvedValue(undefined);
		vi.mocked(accountRepository.create).mockResolvedValue(undefined);
		vi.mocked(emailVerificationService.sendVerificationEmail).mockResolvedValue(
			undefined,
		);
		vi.mocked(hash).mockResolvedValue("hashed_password" as never);

		const result = await userService.create({
			name: "John Doe",
			email: "john@example.com",
			password: "password123",
		});

		expect(result).toMatchObject({
			name: "John Doe",
			email: "john@example.com",
			avatarUrl: null,
		});
		expect(result.id).toBeDefined();
		expect(userRepository.create).toHaveBeenCalledOnce();
		expect(accountRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({ password: "hashed_password" }),
		);
		expect(emailVerificationService.sendVerificationEmail).toHaveBeenCalledWith(
			result.id,
			"john@example.com",
		);
	});

	it("should throw ConflictError when email is already in use", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([mockUser]);

		await expect(
			userService.create({
				name: "Jane",
				email: "john@example.com",
				password: "pass",
			}),
		).rejects.toThrow(ConflictError);

		await expect(
			userService.create({
				name: "Jane",
				email: "john@example.com",
				password: "pass",
			}),
		).rejects.toThrow("Email already in use");

		expect(userRepository.create).not.toHaveBeenCalled();
	});
});

describe("userService.findById", () => {
	it("should return the user when found", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([mockUser]);

		const result = await userService.findById(USER_ID);

		expect(result).toEqual(mockUser);
		expect(userRepository.findById).toHaveBeenCalledWith(USER_ID);
	});

	it("should throw NotFoundError when user does not exist", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([]);

		await expect(userService.findById(USER_ID)).rejects.toThrow(NotFoundError);
		await expect(userService.findById(USER_ID)).rejects.toThrow(
			"User not found",
		);
	});
});

describe("userService.findAll", () => {
	it("should return all users", async () => {
		vi.mocked(userRepository.findAll).mockResolvedValue([mockUser]);

		const result = await userService.findAll();

		expect(result).toEqual([mockUser]);
		expect(userRepository.findAll).toHaveBeenCalledOnce();
	});

	it("should return empty array when no users exist", async () => {
		vi.mocked(userRepository.findAll).mockResolvedValue([]);

		const result = await userService.findAll();

		expect(result).toEqual([]);
	});
});

describe("userService.updateById", () => {
	it("should update user data", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([mockUser]);
		vi.mocked(userRepository.updateById).mockResolvedValue(undefined);

		const result = await userService.updateById(USER_ID, { name: "Jane Doe" });

		expect(result).toMatchObject({
			id: USER_ID,
			name: "Jane Doe",
			email: mockUser.email,
		});
		expect(result.updatedAt).toBeInstanceOf(Date);
	});

	it("should check for email conflict when email is being changed", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([mockUser]);
		vi.mocked(userRepository.findByEmail).mockResolvedValue([
			{ ...mockUser, id: "other-user-id" },
		]);

		await expect(
			userService.updateById(USER_ID, { email: "taken@example.com" }),
		).rejects.toThrow(ConflictError);

		await expect(
			userService.updateById(USER_ID, { email: "taken@example.com" }),
		).rejects.toThrow("Email already in use");
	});

	it("should not check email conflict when email is unchanged", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([mockUser]);
		vi.mocked(userRepository.updateById).mockResolvedValue(undefined);

		await userService.updateById(USER_ID, { email: mockUser.email });

		expect(userRepository.findByEmail).not.toHaveBeenCalled();
	});

	it("should throw NotFoundError when user does not exist", async () => {
		vi.mocked(userRepository.findById).mockResolvedValue([]);

		await expect(
			userService.updateById(USER_ID, { name: "Ghost" }),
		).rejects.toThrow(NotFoundError);
	});
});

describe("userService.deleteById", () => {
	it("should remove all sessions and delete the user", async () => {
		vi.mocked(authService.removeAllUserSessions).mockResolvedValue(undefined);
		vi.mocked(userRepository.deleteById).mockResolvedValue(undefined);

		await userService.deleteById(USER_ID);

		expect(authService.removeAllUserSessions).toHaveBeenCalledWith(USER_ID);
		expect(userRepository.deleteById).toHaveBeenCalledWith(USER_ID);
	});

	it("should invalidate sessions before deleting the user", async () => {
		const order: string[] = [];

		vi.mocked(authService.removeAllUserSessions).mockImplementation(
			async () => {
				order.push("sessions");
			},
		);
		vi.mocked(userRepository.deleteById).mockImplementation(async () => {
			order.push("delete");
		});

		await userService.deleteById(USER_ID);

		expect(order).toEqual(["sessions", "delete"]);
	});
});
