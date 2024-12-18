import { root, tokens } from "../../root.js";
import type { WrapperFn } from "../../types/utils/WrapperFn.ts";

export const errorWrapper: WrapperFn = (fn) => async (req, res) => {
	try {
		return await fn(req, res);
	} catch (error) {
		const logger = root.get(tokens.logger);
		logger.error(`Uncaught exception caught in error wrapper; returning 500 status...`, { error });

		if (error instanceof Error) {
			return res.status(500).send({
				success: false,
				message: error.message
			});
		} else {
			return res.status(500).send({
				success: false,
				message: "Request failed for an unknown reason; see logs for details."
			});
		}
	}
};
