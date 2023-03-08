import env from "env-var";
import type { ProcessedVoicemail } from "../../src/types/data/ProcessedVoicemail";
import type { IAlertingService } from "../../src/types/services/IAlertingService";
import type { ISpeechService } from "../../src/types/services/ISpeechService";
import type { IVoicemailService } from "../../src/types/services/IVoicemailService";
import type { IVOIPClient } from "../types/services/clients/IVOIPClient";
import type { ILogger } from "../types/utils/ILogger";

const TARGET_MAILBOX_ID = env.get("VOIP_MS_TARGET_MAILBOX_ID").required().asString();

export class VoicemailService implements IVoicemailService {
	#speechService: ISpeechService;
	#alertingService: IAlertingService;
	#voipService: IVOIPClient;
	#logger: ILogger;

	constructor(speechService: ISpeechService, alertingService: IAlertingService, voipService: IVOIPClient, logger: ILogger) {
		this.#speechService = speechService;
		this.#alertingService = alertingService;
		this.#voipService = voipService;
		this.#logger = logger;
	}

	public async processVoicemails(): Promise<void> {
		this.#logger.info("Begin processing voicemails");

		const messages = await this.#voipService.getVoicemails(TARGET_MAILBOX_ID);
		const unreadMessages = messages.filter((message) => message.listened === "no");

		if (!unreadMessages.length) {
			this.#logger.info("No unread messages; returning...");
			return;
		}

		for (const message of unreadMessages) {
			const messageData = await this.#voipService.getVoicemailFile(TARGET_MAILBOX_ID, message.folder, message.message_num, "wav");
			const transcribedText = await this.#speechService.transcribe(messageData);
			const callerID = message.callerid.split(" ")[0];
			await this.sendAlerts({
				phoneNumber: callerID,
				transcribedText
			});
			await this.#voipService.markVoicemailRead(TARGET_MAILBOX_ID, message.folder, message.message_num);
		}
	}

	private async sendAlerts(input: ProcessedVoicemail): Promise<void> {
		await this.#alertingService.sendPushNotification({
			title: "New voicemail received from " + input.phoneNumber,
			content: input.transcribedText
		});
	}
}
