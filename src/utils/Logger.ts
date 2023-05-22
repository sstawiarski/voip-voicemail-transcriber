import { Logger as WinstonLogger } from "winston";
import type { ILogger } from "../../src/types/utils/ILogger";

export class Logger implements ILogger {
	#logger: WinstonLogger;

	constructor(logger: WinstonLogger) {
		this.#logger = logger;
	}

	public info(message: string, data?: any) {
		this.#logger.info.apply(this.#logger, [message, ...(!!data ? [data] : [])] as any);
	}

	public debug(message: string, data?: any) {
		this.#logger.debug.apply(this.#logger, [message, ...(!!data ? [data] : [])] as any);
	}

	public warn(message: string, data?: any) {
		this.#logger.warn.apply(this.#logger, [message, ...(!!data ? [data] : [])] as any);
	}

	public error(message: string, data?: any) {
		this.#logger.error.apply(this.#logger, [message, ...(!!data ? [data] : [])] as any);
	}
}
