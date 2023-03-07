import { Logger as WinstonLogger } from "winston";
import { ILogger } from "../../src/types/utils/ILogger";

export class Logger implements ILogger {
	#logger: WinstonLogger;

	constructor(logger: WinstonLogger) {
		this.#logger = logger;
	}

	public info(message: string, data?: any) {
		this.#logger.info.apply(this, [message, ...(!!data ? [data] : [])] as any);
	}

	public debug(message: string, data?: any) {
		this.#logger.debug.apply(this, [message, ...(!!data ? [data] : [])] as any);
	}

	public error(message: string, data?: any) {
		this.#logger.error.apply(this, [message, ...(!!data ? [data] : [])] as any);
	}
}
