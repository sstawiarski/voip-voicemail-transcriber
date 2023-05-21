import { http } from "@google-cloud/functions-framework";
import { handler as voicemailHandlerFn, functionName as voicemailHandlerFnName } from "./controllers/voicemail";

/** Register handlers */
http(voicemailHandlerFnName, voicemailHandlerFn);
