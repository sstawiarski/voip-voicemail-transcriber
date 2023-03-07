import { EmailRequest } from "../data/EmailRequest";
import { PushNotificationRequest } from "../data/PushNotificationRequest";

export interface IAlertingService {
	sendPushNotification: (input: PushNotificationRequest) => Promise<void>;
	sendEmailNotification: (input: EmailRequest) => Promise<void>;
}
