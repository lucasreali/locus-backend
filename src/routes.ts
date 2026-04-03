import { authController } from "./modules/auth/core/auth.controller";
import { emailVerificationController } from "./modules/auth/email-verification/email-verification.controller";

import { userController } from "./modules/user/user.controller";
import type { FastifyTypeInstance } from "./types";

export const routes = (app: FastifyTypeInstance) => {
	app.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() };
	});

	app.register(authController, { prefix: "/auth" });
	app.register(emailVerificationController, { prefix: "/auth" });

	app.register(userController, { prefix: "/users" });
};
