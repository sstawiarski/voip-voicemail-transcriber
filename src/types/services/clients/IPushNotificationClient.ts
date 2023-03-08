import { PushNotificationRequest } from "../../data/PushNotificationRequest";

export interface IPushNotificationClient {
	sendPush: (input: PushNotificationRequest) => Promise<void>;
}
