import { build } from "./app";
import { env } from "./config/env";
import "./modules/mail/mail.worker";
import "./modules/notification/notification.worker";
import "./modules/syllabus/syllabus.worker";
import { scheduleNotificationCron } from "./modules/notification/notification.queue";

const app = build();

const run = async () => {
	try {
		const port = Number(env.PORT) || 8080;
		const host = env.HOST || "0.0.0.0";
		await app.listen({ host, port });
		await scheduleNotificationCron();
		console.log(`HTTP server running on port ${port}`);
		console.log("Mail worker initialized");
		console.log("Syllabus worker initialized");
		console.log("Notification worker initialized");
	} catch (error) {
		app.log.error(error);
		process.exit();
	}
};

run();
