import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/config/env";
import { schema } from "./schema";

const enableLogs = env.NODE_ENV === "test";

const testLogger = {
	logQuery(query: string, params: unknown[]) {
		console.log("[drizzle]", query, params);
	},
};

export const db = drizzle(env.DATABASE_URL, {
	schema,
	logger: enableLogs ? testLogger : false,
	casing: "snake_case",
});
