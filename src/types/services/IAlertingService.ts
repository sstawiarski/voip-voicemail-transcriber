import type { EmailRequest } from "../data/EmailRequest.ts";
import type { PushNotificationRequest } from "../data/PushNotificationRequest.ts";

export interface IAlertingService {
	sendPushNotification: (input: PushNotificationRequest) => Promise<void>;
	sendEmailNotification: (input: EmailRequest) => Promise<void>;
}
