import { env } from "@/config/env";
import { Resend } from "resend";
import type { mailRequestStatic } from "./mail.dto";
import { mailQueue } from "./mail.queue";

const resend = new Resend(env.RESEND_API_KEY);

export const mailService = {
	async sendMail(data: mailRequestStatic) {
		const { data: result } = await resend.emails.send({
			from: env.EMAIL_FROM,
			to: data.to,
			subject: data.subject,
			html: data.html,
		});

		return result;
	},

	async queueMail(data: mailRequestStatic) {
		try {
			const job = await mailQueue.add("sendMail", data, {
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 2000,
				},
			});

			console.log("Email queued successfully:", job.id);
			return {
				message: "Email queued successfully",
				jobId: job.id,
			};
		} catch (error) {
			console.error("Error queueing email:", error);
			throw error;
		}
	},

	async sendTestMail(data: mailRequestStatic) {
		return this.queueMail(data);
	},
};
