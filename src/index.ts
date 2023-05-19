import { http } from "@google-cloud/functions-framework";
import env from "env-var";
import { root, tokens } from "./root";
import errorWrapper from "./utils/wrappers/errorWrapper";

const SECRET_NAME = env.get("SECRET_NAME").required().asString();

http(
	"voicemail_handler",
	errorWrapper(async (req, res) => {
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

		const voicemailService = root.get(tokens.voicemailService);

		await voicemailService.processVoicemails();

		res.status(200).send();
	})
);
