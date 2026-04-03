import { build } from "./app";
import { env } from "./config/env";
import "./modules/mail/mail.worker";

const app = build();

const run = async () => {
	try {
		const port = Number(env.PORT) || 8080;
		const host = env.HOST || "0.0.0.0";
		await app.listen({ host, port });
		console.log(`HTTP server running on port ${port}`);
		console.log("Mail worker initialized");
	} catch (error) {
		app.log.error(error);
		process.exit();
	}
};

run();
