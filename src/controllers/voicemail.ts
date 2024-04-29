import type { HttpFunction } from "@google-cloud/functions-framework";
import { function as function_ } from "fp-ts";
import { root, tokens } from "../root.js";
import { authWrapper, errorWrapper } from "../utils/wrappers/index.js";
const pipe = function_.pipe;

const FUNCTION_NAME = "voicemail_handler";
const voicemailHandlerFnBase: HttpFunction = async (_, res) => {
	const voicemailService = root.get(tokens.voicemailService);

	const count = await voicemailService.processVoicemails();

	res.status(200).send({ success: true, message: `Successfully processed ${count} voicemails` });
};

export const handler = pipe(voicemailHandlerFnBase, authWrapper, errorWrapper);
export const functionName = FUNCTION_NAME;
