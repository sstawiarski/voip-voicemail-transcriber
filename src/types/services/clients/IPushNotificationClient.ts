import type { PushNotificationRequest } from "../../data/PushNotificationRequest.ts";

export interface IPushNotificationClient {
	sendPush: (input: PushNotificationRequest) => Promise<void>;
}
