import { http } from "@google-cloud/functions-framework";
import { voicemail } from "./controllers/index.js";

/** Register handlers */
http(voicemail.functionName, voicemail.handler);
