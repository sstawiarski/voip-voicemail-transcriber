import { format, parse } from "date-fns";
import env from "env-var";
import type { ProcessedVoicemail } from "../../src/types/data/ProcessedVoicemail";
import type { IAlertingService } from "../../src/types/services/IAlertingService";
import type { ISpeechService } from "../../src/types/services/ISpeechService";
import type { IVoicemailService } from "../../src/types/services/IVoicemailService";
import Constants from "../constants";
import type { Voicemail } from "../types/data/voip/Voicemail";
import type { IVOIPClient } from "../types/services/clients/IVOIPClient";
import type { ILogger } from "../types/utils/ILogger";
import type { CloudStorageFileInput, ICloudStorage } from "../types/utils/cloud/ICloudStorage";

const TARGET_MAILBOX_ID = env.get("VOIP_MS_TARGET_MAILBOX_ID").required().asString();
const VOICEMAIL_OUTPUT_BUCKET = env.get("VOICEMAIL_OUTPUT_BUCKET").required().asString();

export class VoicemailService implements IVoicemailService {
	#speechService: ISpeechService;
	#alertingService: IAlertingService;
	#voipService: IVOIPClient;
	#cloudStorage: ICloudStorage;
	#logger: ILogger;

	constructor(speechService: ISpeechService, alertingService: IAlertingService, voipService: IVOIPClient, cloudStorage: ICloudStorage, logger: ILogger) {
		this.#speechService = speechService;
		this.#alertingService = alertingService;
		this.#voipService = voipService;
		this.#cloudStorage = cloudStorage;
		this.#logger = logger;
	}

	public async processVoicemails(): Promise<number> {
		this.#logger.info("Begin processing voicemails");

		const messages = await this.#voipService.getVoicemails(TARGET_MAILBOX_ID);
		if (!messages.length) {
			this.#logger.info("No messages found; returning...");
			return 0;
		}

		const unreadMessages = messages.filter((message) => message.listened === "no");
		if (!unreadMessages.length) {
			this.#logger.info("No unread messages; returning...");
			return 0;
		}

		const voicemailFiles = (await Promise.all(unreadMessages.map(this.processVoicemail.bind(this)))).flat();

		await this.#cloudStorage.saveFiles(voicemailFiles);

		this.#logger.info("Voicemail processing completed successfully!");

		return unreadMessages.length;
	}

	private async processVoicemail(message: Voicemail): Promise<[CloudStorageFileInput, CloudStorageFileInput]> {
		const messageData = await this.#voipService.getVoicemailFile(TARGET_MAILBOX_ID, message.folder, message.message_num, Constants.AUDIO_FILE_EXTENSION);
		const transcribedText = await this.#speechService.transcribe(messageData);
		const callerID = message.callerid.split(" ")[0];

		await Promise.all([
			this.sendAlerts({
				phoneNumber: callerID,
				transcribedText
			}),
			this.#voipService.markVoicemailRead(TARGET_MAILBOX_ID, message.folder, message.message_num)
		]);

		const messageDate = parse(message.date, "yyyy-MM-dd HH:mm:ss", new Date());
		const filePrefixDate = format(messageDate, "yyyy/MM/dd");

		return [
			{
				destinationBucket: VOICEMAIL_OUTPUT_BUCKET,
				destinationFileName: `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${message.mailbox}_${message.message_num}_audio.${
					Constants.AUDIO_FILE_EXTENSION
				}`,
				data: Buffer.from(messageData, "base64")
			},
			{
				destinationBucket: VOICEMAIL_OUTPUT_BUCKET,
				destinationFileName: `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${message.mailbox}_${message.message_num}_transcription.${
					Constants.TRANSCRIPTION_FILE_EXTENSION
				}`,
				data: transcribedText
			}
		];
	}

	private async sendAlerts(input: ProcessedVoicemail): Promise<void> {
		await this.#alertingService.sendPushNotification({
			title: "New voicemail received from " + input.phoneNumber,
			content: input.transcribedText
		});
	}
}
