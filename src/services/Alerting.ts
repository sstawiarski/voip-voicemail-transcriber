import type { EmailRequest } from "../../src/types/data/EmailRequest";
import type { PushNotificationRequest } from "../../src/types/data/PushNotificationRequest";

import type { IPushNotificationClient } from "../../src/types/services/clients/IPushNotificationClient";

import type { IEmailClient } from "../types/services/clients/IEmailClient";
import type { ILogger } from "../types/utils/ILogger";
import type { IAlertingService } from "../types/services/IAlertingService";

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
