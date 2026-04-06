import { authController } from "./modules/auth/core/auth.controller";
import { emailVerificationController } from "./modules/auth/email-verification/email-verification.controller";
import { eventController } from "./modules/event/event.controller";
import { noteController } from "./modules/note/note.controller";
import { notificationController } from "./modules/notification/notification.controller";
import { subjectController } from "./modules/subject/subject.controller";
import { syllabusController } from "./modules/syllabus/syllabus.controller";
import { userController } from "./modules/user/user.controller";
import type { FastifyTypeInstance } from "./types";

export const routes = (app: FastifyTypeInstance) => {
	app.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() };
	});

	app.register(authController, { prefix: "/auth" });
	app.register(emailVerificationController, { prefix: "/auth" });

	app.register(subjectController, { prefix: "/subjects" });
	app.register(userController, { prefix: "/users" });

	app.register(eventController, { prefix: "/events" });
	app.register(syllabusController, { prefix: "/syllabus" });
	app.register(noteController, { prefix: "/notes" });
	app.register(notificationController, { prefix: "/notifications" });
};
