import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
	test: {
		include: ["./tests/**/*.spec.ts"],
		exclude: [...configDefaults.exclude, "tests/testUtils/**"]
	}
});
