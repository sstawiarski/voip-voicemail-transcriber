import { describe, expect, it, vi } from "vitest";
import { Logger as WinstonLogger } from "winston";
import { Logger } from "../../../src/utils/Logger";

describe("Logger Test Suite", () => {
	it("should successfully log an 'info' level log", () => {
		const mockInfoFn = vi.fn();
		const mockWinstonLogger: Partial<WinstonLogger> = {
			info: mockInfoFn
		};

		const logger = new Logger(mockWinstonLogger as any);

		logger.info("test");

		expect(mockInfoFn).toHaveBeenCalledTimes(1);
		expect(mockInfoFn).toHaveBeenLastCalledWith("test");
	});

	it("should successfully log a 'debug' level log", () => {
		const mockDebugFn = vi.fn();
		const mockWinstonLogger: Partial<WinstonLogger> = {
			debug: mockDebugFn
		};

		const logger = new Logger(mockWinstonLogger as any);

		logger.debug("test");

		expect(mockDebugFn).toHaveBeenCalledTimes(1);
		expect(mockDebugFn).toHaveBeenLastCalledWith("test");
	});

	it("should successfully log a 'warn' level log", () => {
		const mockWarnFn = vi.fn();
		const mockWinstonLogger: Partial<WinstonLogger> = {
			warn: mockWarnFn
		};

		const logger = new Logger(mockWinstonLogger as any);

		logger.warn("test");

		expect(mockWarnFn).toHaveBeenCalledTimes(1);
		expect(mockWarnFn).toHaveBeenLastCalledWith("test");
	});

	it("should successfully log an 'error' level log", () => {
		const mockErrorFn = vi.fn();
		const mockWinstonLogger: Partial<WinstonLogger> = {
			error: mockErrorFn
		};

		const logger = new Logger(mockWinstonLogger as any);

		logger.error("test");

		expect(mockErrorFn).toHaveBeenCalledTimes(1);
		expect(mockErrorFn).toHaveBeenLastCalledWith("test");
	});
});
