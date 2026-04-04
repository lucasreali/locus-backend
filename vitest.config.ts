import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/locus",
		},
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "./src"),
		},
	},
});
