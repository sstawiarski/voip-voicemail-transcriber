import { format, parse } from "date-fns";
import { Environment } from "../utils/Environment.js";
import type { ProcessedVoicemail } from "../../src/types/data/ProcessedVoicemail.ts";
import type { IAlertingService } from "../../src/types/services/IAlertingService.ts";
import type { ISpeechService } from "../../src/types/services/ISpeechService.ts";
import type { IVoicemailService } from "../../src/types/services/IVoicemailService.ts";
import { ApplicationConstants, GeneralConstants, VoipConstants } from "../constants/index.js";
import type { Voicemail } from "../types/data/voip/Voicemail.ts";
import type { IVOIPClient } from "../types/services/clients/IVOIPClient.ts";
import type { ILogger } from "../types/utils/ILogger.ts";
import type { CloudStorageFileInput, ICloudStorage } from "../types/utils/cloud/ICloudStorage.ts";

export class VoicemailService implements IVoicemailService {
	#speechService: ISpeechService;
	#alertingService: IAlertingService;
	#voipService: IVOIPClient;
	#cloudStorage: ICloudStorage;
	#logger: ILogger;
	#mailboxId: string;
	#outputBucket: string;

	constructor(
		speechService: ISpeechService,
		alertingService: IAlertingService,
		voipService: IVOIPClient,
		cloudStorage: ICloudStorage,
		logger: ILogger
	) {
		this.#speechService = speechService;
		this.#alertingService = alertingService;
		this.#voipService = voipService;
		this.#cloudStorage = cloudStorage;
		this.#logger = logger;

		this.#mailboxId = Environment.VOIP.getMailboxId();
		this.#outputBucket = Environment.VOIP.getOutputBucket();
	}

	public async processVoicemails(): Promise<number> {
		this.#logger.info("Begin processing voicemails");

		const messages = await this.#voipService.getVoicemails(this.#mailboxId);
		if (!messages.length) {
			this.#logger.info("No messages found; returning...");
			return 0;
		}

		const unreadMessages = messages.filter((message) => message.listened === VoipConstants.VOIP_MS_STATUSES.NO);
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
		const messageData = await this.#voipService.getVoicemailFile(
			this.#mailboxId,
			message.folder,
			message.message_num,
			ApplicationConstants.AUDIO_FILE_EXTENSION
		);
		const transcribedText = await this.#speechService.transcribe(messageData);
		const callerID = message.callerid.split(" ")[0];

		await Promise.all([
			this.sendAlerts({
				phoneNumber: callerID,
				transcribedText
			}),
			this.#voipService.markVoicemailRead(this.#mailboxId, message.folder, message.message_num)
		]);

		const messageDate = parse(message.date, "yyyy-MM-dd HH:mm:ss", new Date());
		const filePrefixDate = format(messageDate, "yyyy/MM/dd");

		return [
			{
				destinationBucket: this.#outputBucket,
				destinationFileName: `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${message.mailbox}_${
					message.message_num
				}_audio.${ApplicationConstants.AUDIO_FILE_EXTENSION}`,
				data: Buffer.from(messageData, GeneralConstants.BUFFER_FORMATS.BASE_64)
			},
			{
				destinationBucket: this.#outputBucket,
				destinationFileName: `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${message.mailbox}_${
					message.message_num
				}_transcription.${ApplicationConstants.TRANSCRIPTION_FILE_EXTENSION}`,
				data: transcribedText
			}
		];
	}

	private async sendAlerts(input: ProcessedVoicemail): Promise<void> {
		await this.#alertingService.sendPushNotification({
			title: `New voicemail received from ${input.phoneNumber}`,
			content: input.transcribedText
		});
	}
}
