import { aiController } from "./modules/ai/ai.controller";
import { authController } from "./modules/auth/core/auth.controller";
import { emailVerificationController } from "./modules/auth/email-verification/email-verification.controller";
import { eventController } from "./modules/event/event.controller";
import { noteController } from "./modules/note/note.controller";
import { subjectController } from "./modules/subject/subject.controller";
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
	app.register(eventController, { prefix: "/calendar" });
	app.register(aiController, { prefix: "/ai" });
	app.register(noteController, { prefix: "/notes" });
};
