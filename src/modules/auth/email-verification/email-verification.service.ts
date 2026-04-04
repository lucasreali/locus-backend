import { env } from "@/config/env";
import { ConflictError } from "@/shared/errors/ConflictError";
import { NotFoundError } from "@/shared/errors/NotFoundError";
import { v7 } from "uuid";
import { mailService } from "../../mail/mail.service";
import { userRepository } from "../../user/user.repository";
import { accountRepository } from "../account.repository";
import { emailVerificationRepository } from "./email-verification.repository";

export const emailVerificationService = {
	async sendVerificationEmail(userId: string, email: string) {
		await emailVerificationRepository.deleteByUserId(userId);

		const token = v7();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

		await emailVerificationRepository.create({
			userId,
			token,
			expiresAt,
		});

		const verificationUrl = `${env.BACKEND_URL}/auth/verify-email?token=${token}`;

		await mailService.queueMail({
			to: email,
			subject: "Verify your email address - locus",
			html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; max-width: 480px; margin: auto; text-align: center;">
                    <h2 style="color: #111827; margin-bottom: 12px;">Email Verification</h2>
                    <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">
                        Please click the button below to verify your email address.
                    </p>
                    <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; display: inline-block; font-weight: bold;">
                        Verify Email
                    </a>
                    <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
                        This link will expire in <strong>24 hours</strong>.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin-top: 12px;">
                        If you didn’t request this, you can safely ignore this message.
                    </p>
                </div>

            `,
		});
	},

	async verifyEmail(token: string) {
		const [tokenData] = await emailVerificationRepository.findByToken(token);

		if (!tokenData) {
			throw new NotFoundError("Invalid or expired verification token");
		}

		const [account] = await accountRepository.findByUserId(tokenData.userId);
		if (!account) {
			throw new NotFoundError("Account not found");
		}

		if (account.emailVerified) {
			throw new ConflictError("Email already verified");
		}

		// Marca email como verificado na tabela accounts
		await accountRepository.markEmailAsVerified(tokenData.userId);

		// Remove o token usado
		await emailVerificationRepository.deleteByToken(token);

		return { message: "Email verified successfully" };
	},

	async resendVerificationEmail(email: string) {
		const [user] = await userRepository.findByEmail(email);

		if (!user) {
			throw new NotFoundError("User not found");
		}

		const [account] = await accountRepository.findByUserId(user.id);
		if (!account) {
			throw new NotFoundError("Account not found");
		}

		if (account.emailVerified) {
			throw new ConflictError("Email already verified");
		}

		await this.sendVerificationEmail(user.id, user.email);

		return { message: "Verification email sent" };
	},
};
