import type { HttpFunction } from "@google-cloud/functions-framework";
import { pipe } from "fp-ts/function";
import { root, tokens } from "../root";
import { authWrapper, errorWrapper } from "../utils/wrappers";

const FUNCTION_NAME = "voicemail_handler";
const voicemailHandlerFnBase: HttpFunction = async (_, res) => {
	const voicemailService = root.get(tokens.voicemailService);

	const count = await voicemailService.processVoicemails();

	res.status(200).send({ success: true, message: `Successfully processed ${count} voicemails` });
};

export const handler = pipe(voicemailHandlerFnBase, authWrapper, errorWrapper);
export const functionName = FUNCTION_NAME;
