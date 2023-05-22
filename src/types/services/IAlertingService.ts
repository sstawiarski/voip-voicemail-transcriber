import type { EmailRequest } from "../data/EmailRequest";
import type { PushNotificationRequest } from "../data/PushNotificationRequest";

export interface IAlertingService {
	sendPushNotification: (input: PushNotificationRequest) => Promise<void>;
	sendEmailNotification: (input: EmailRequest) => Promise<void>;
}
