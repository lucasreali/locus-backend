import { accountRepository } from "@/modules/auth/account.repository";
import { emailVerificationRepository } from "@/modules/auth/email-verification/email-verification.repository";
import { emailVerificationService } from "@/modules/auth/email-verification/email-verification.service";
import { mailService } from "@/modules/mail/mail.service";
import { userRepository } from "@/modules/user/user.repository";
import { ConflictError } from "@/shared/errors/ConflictError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/auth/email-verification/email-verification.repository");
vi.mock("@/modules/auth/account.repository");
vi.mock("@/modules/mail/mail.service");
vi.mock("@/modules/user/user.repository");
vi.mock("@/config/env", () => ({
	env: {
		BACKEND_URL: "http://localhost:3000",
		RESEND_API_KEY: "test-key",
		EMAIL_FROM: "no-reply@test.com",
	},
}));

const USER_ID = "019746c0-0000-7000-8000-000000000001";
const TOKEN = "019746c0-0000-7000-8000-000000000099";

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
	emailVerified: false,
	accessToken: null as string | null,
	createdAt: new Date("2024-01-01"),
	updatedAt: new Date("2024-01-01"),
};

const mockTokenData = {
	id: "019746c0-0000-7000-8000-000000000020",
	userId: USER_ID,
	token: TOKEN,
	expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
	createdAt: new Date("2024-01-01"),
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("emailVerificationService.sendVerificationEmail", () => {
	it("should delete existing tokens, create a new one and queue the email", async () => {
		vi.mocked(emailVerificationRepository.deleteByUserId).mockResolvedValue(
			undefined,
		);
		vi.mocked(emailVerificationRepository.create).mockResolvedValue(undefined);
		vi.mocked(mailService.queueMail).mockResolvedValue({
			message: "Email queued successfully",
			jobId: "job-1",
		});

		await emailVerificationService.sendVerificationEmail(
			USER_ID,
			mockUser.email,
		);

		expect(emailVerificationRepository.deleteByUserId).toHaveBeenCalledWith(
			USER_ID,
		);
		expect(emailVerificationRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: USER_ID,
				token: expect.any(String),
				expiresAt: expect.any(Date),
			}),
		);
		expect(mailService.queueMail).toHaveBeenCalledWith(
			expect.objectContaining({
				to: mockUser.email,
				subject: expect.stringContaining("Verify"),
			}),
		);
	});
});

describe("emailVerificationService.verifyEmail", () => {
	it("should verify email successfully", async () => {
		vi.mocked(emailVerificationRepository.findByToken).mockResolvedValue([
			mockTokenData,
		]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([mockAccount]);
		vi.mocked(accountRepository.markEmailAsVerified).mockResolvedValue(
			undefined,
		);
		vi.mocked(emailVerificationRepository.deleteByToken).mockResolvedValue(
			undefined,
		);

		const result = await emailVerificationService.verifyEmail(TOKEN);

		expect(result).toEqual({ message: "Email verified successfully" });
		expect(accountRepository.markEmailAsVerified).toHaveBeenCalledWith(USER_ID);
		expect(emailVerificationRepository.deleteByToken).toHaveBeenCalledWith(
			TOKEN,
		);
	});

	it("should throw NotFoundError when token is invalid or expired", async () => {
		vi.mocked(emailVerificationRepository.findByToken).mockResolvedValue([]);

		await expect(
			emailVerificationService.verifyEmail("invalid-token"),
		).rejects.toThrow(NotFoundError);

		await expect(
			emailVerificationService.verifyEmail("invalid-token"),
		).rejects.toThrow("Invalid or expired verification token");
	});

	it("should throw NotFoundError when account is not found", async () => {
		vi.mocked(emailVerificationRepository.findByToken).mockResolvedValue([
			mockTokenData,
		]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([]);

		await expect(emailVerificationService.verifyEmail(TOKEN)).rejects.toThrow(
			NotFoundError,
		);
	});

	it("should throw ConflictError when email is already verified", async () => {
		vi.mocked(emailVerificationRepository.findByToken).mockResolvedValue([
			mockTokenData,
		]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([
			{ ...mockAccount, emailVerified: true },
		]);

		await expect(emailVerificationService.verifyEmail(TOKEN)).rejects.toThrow(
			ConflictError,
		);

		await expect(emailVerificationService.verifyEmail(TOKEN)).rejects.toThrow(
			"Email already verified",
		);
	});
});

describe("emailVerificationService.resendVerificationEmail", () => {
	it("should resend the verification email", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([mockUser]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([mockAccount]);
		vi.mocked(emailVerificationRepository.deleteByUserId).mockResolvedValue(
			undefined,
		);
		vi.mocked(emailVerificationRepository.create).mockResolvedValue(undefined);
		vi.mocked(mailService.queueMail).mockResolvedValue({
			message: "Email queued successfully",
			jobId: "job-1",
		});

		const result = await emailVerificationService.resendVerificationEmail(
			mockUser.email,
		);

		expect(result).toEqual({ message: "Verification email sent" });
		expect(mailService.queueMail).toHaveBeenCalled();
	});

	it("should throw NotFoundError when user does not exist", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([]);

		await expect(
			emailVerificationService.resendVerificationEmail("ghost@example.com"),
		).rejects.toThrow(NotFoundError);

		await expect(
			emailVerificationService.resendVerificationEmail("ghost@example.com"),
		).rejects.toThrow("User not found");
	});

	it("should throw NotFoundError when account does not exist", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([mockUser]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([]);

		await expect(
			emailVerificationService.resendVerificationEmail(mockUser.email),
		).rejects.toThrow(NotFoundError);
	});

	it("should throw ConflictError when email is already verified", async () => {
		vi.mocked(userRepository.findByEmail).mockResolvedValue([mockUser]);
		vi.mocked(accountRepository.findByUserId).mockResolvedValue([
			{ ...mockAccount, emailVerified: true },
		]);

		await expect(
			emailVerificationService.resendVerificationEmail(mockUser.email),
		).rejects.toThrow(ConflictError);

		await expect(
			emailVerificationService.resendVerificationEmail(mockUser.email),
		).rejects.toThrow("Email already verified");
	});
});
