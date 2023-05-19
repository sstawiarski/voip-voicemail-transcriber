import { HttpFunction } from "@google-cloud/functions-framework";
import { root, tokens } from "../../root";

type WrapperFn = (fn: HttpFunction) => HttpFunction;

const wrapper: WrapperFn = (fn: HttpFunction) => async (req, res) => {
	try {
		return await fn(req, res);
	} catch (error) {
		const logger = root.get(tokens.logger);
		logger.error(`Uncaught exception caught in error wrapper; returning 500 status...`, { error });

		if (error instanceof Error) {
			return res.status(500).send({
				message: error.message
			});
		} else {
			return res.status(500).send({
				message: "Request failed for an unknown reason; see logs for details."
			});
		}
	}
};

export default wrapper;
