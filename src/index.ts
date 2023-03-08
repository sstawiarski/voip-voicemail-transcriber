import { http } from "@google-cloud/functions-framework";
import env from "env-var";
import { root } from "./root";

const SECRET_NAME = env.get("SECRET_NAME").required().asString();

http("voicemail_handler", async (req, res) => {
	const { secretsManager, logger } = root.items;

	const { EXPECTED_AUTH_QUERY_PARAM } = await secretsManager.getSecretValue(SECRET_NAME);
	if (!req.query["auth"] || req.query["auth"] !== EXPECTED_AUTH_QUERY_PARAM) {
		logger.debug("Unauthorized access attemped");

		res.status(403).send();
		return;
	}

	const voicemailService = root.get("voicemailService");
	logger.debug("Starting voicemail processing");
	await voicemailService.processVoicemails();
	logger.debug("Voicemail processing finished successfully");

	res.status(200).send();
});
