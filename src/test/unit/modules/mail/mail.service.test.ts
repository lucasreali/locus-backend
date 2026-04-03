import { mailQueue } from "@/modules/mail/mail.queue";
import { mailService } from "@/modules/mail/mail.service";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/modules/mail/mail.queue", () => ({
	mailQueue: {
		add: vi.fn(),
	},
}));

vi.mock("@/config/env", () => ({
	env: {
		RESEND_API_KEY: "test-resend-key",
		EMAIL_FROM: "no-reply@test.com",
	},
}));

const mockResendSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
	Resend: vi.fn(function (this: { emails: { send: typeof mockResendSend } }) {
		this.emails = { send: mockResendSend };
	}),
}));

const mailData = {
	to: "recipient@example.com",
	subject: "Test Subject",
	html: "<p>Test body</p>",
};

beforeEach(() => {
	vi.clearAllMocks();
});

describe("mailService.sendMail", () => {
	it("should send mail via Resend and return the result", async () => {
		const mockResult = { id: "resend-msg-id-123" };
		mockResendSend.mockResolvedValue({ data: mockResult, error: null });

		const result = await mailService.sendMail(mailData);

		expect(result).toEqual(mockResult);
		expect(mockResendSend).toHaveBeenCalledWith({
			from: "no-reply@test.com",
			to: mailData.to,
			subject: mailData.subject,
			html: mailData.html,
		});
	});

	it("should return undefined data when Resend returns no data", async () => {
		mockResendSend.mockResolvedValue({
			data: null,
			error: { message: "Failed" },
		});

		const result = await mailService.sendMail(mailData);

		expect(result).toBeNull();
	});
});

describe("mailService.queueMail", () => {
	it("should add the mail job to the queue and return jobId", async () => {
		vi.mocked(mailQueue.add).mockResolvedValue({ id: "job-123" } as never);

		const result = await mailService.queueMail(mailData);

		expect(result).toEqual({
			message: "Email queued successfully",
			jobId: "job-123",
		});
		expect(mailQueue.add).toHaveBeenCalledWith("sendMail", mailData, {
			attempts: 3,
			backoff: { type: "exponential", delay: 2000 },
		});
	});

	it("should throw when the queue throws", async () => {
		vi.mocked(mailQueue.add).mockRejectedValue(new Error("Redis unavailable"));

		await expect(mailService.queueMail(mailData)).rejects.toThrow(
			"Redis unavailable",
		);
	});
});

describe("mailService.sendTestMail", () => {
	it("should delegate to queueMail", async () => {
		vi.mocked(mailQueue.add).mockResolvedValue({ id: "job-456" } as never);

		const result = await mailService.sendTestMail(mailData);

		expect(result).toEqual({
			message: "Email queued successfully",
			jobId: "job-456",
		});
		expect(mailQueue.add).toHaveBeenCalledOnce();
	});
});
