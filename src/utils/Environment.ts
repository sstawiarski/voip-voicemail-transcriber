import env from "env-var";

export class Environment {
    static VOIP = {
        getMailboxId: env.get("VOIP_MS_TARGET_MAILBOX_ID").required().asString,
        getOutputBucket: env.get("VOICEMAIL_OUTPUT_BUCKET").required().asString
    }
}