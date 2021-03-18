import type {Config} from "@jest/types";

const config: Config.InitialOptions = {
	preset: "ts-jest",
	testEnvironment: "node",
	testMatch: [
		"<rootDir>/tests/**/*.test.ts"
	],
};
export default config;
