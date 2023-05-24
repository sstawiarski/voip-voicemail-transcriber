import env from "env-var";
import { root, tokens } from "../../root";
import type { WrapperFn } from "../../types/utils/WrapperFn";

const SECRET_NAME = env.get("SECRET_NAME").required().asString();

export const authWrapper: WrapperFn = (fn) => async (req, res) => {
	const secretsManager = root.get(tokens.secretsManager);
	const logger = root.get(tokens.logger);

	const { EXPECTED_AUTH_QUERY_PARAM } = await secretsManager.getSecretValue(SECRET_NAME);

	if (!req.query["auth"] || typeof req.query["auth"] !== "string" || req.query["auth"] !== encodeURIComponent(EXPECTED_AUTH_QUERY_PARAM)) {
		logger.debug("Unauthorized access attemped", {
			EXPECTED_AUTH_QUERY_PARAM,
			RECEIVED: req.query["auth"]
		});

		res.status(403).send();
		return;
	}

	return fn(req, res);
};
