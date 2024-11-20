import type { EmailRequest } from "../../src/types/data/EmailRequest.ts";
import type { PushNotificationRequest } from "../../src/types/data/PushNotificationRequest.ts";
import type { IPushNotificationClient } from "../../src/types/services/clients/IPushNotificationClient.ts";
import type { IEmailClient } from "../types/services/clients/IEmailClient.ts";
import type { IAlertingService } from "../types/services/IAlertingService.ts";
import type { ILogger } from "../types/utils/ILogger.ts";

export class AlertingService implements IAlertingService {
	#emailService: IEmailClient;
	#pushNotificationService: IPushNotificationClient;
	#logger: ILogger;

	constructor(emailService: IEmailClient, pushNotificationService: IPushNotificationClient, logger: ILogger) {
		this.#emailService = emailService;
		this.#pushNotificationService = pushNotificationService;
		this.#logger = logger;
	}

	public sendEmailNotification(input: EmailRequest): Promise<void> {
		this.#logger.info("Sending email notification...");

		return this.#emailService.sendEmail(input);
	}

	public sendPushNotification(input: PushNotificationRequest): Promise<void> {
		this.#logger.info("Sending push notification...");

		return this.#pushNotificationService.sendPush(input);
	}
}
