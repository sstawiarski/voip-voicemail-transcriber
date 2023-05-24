import { http } from "@google-cloud/functions-framework";
import { voicemail } from "./controllers";

/** Register handlers */
http(voicemail.functionName, voicemail.handler);
