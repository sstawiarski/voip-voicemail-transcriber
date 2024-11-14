import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import type { PushNotificationRequest } from "../../../src/types/data/PushNotificationRequest.ts";

export const PushNotificationRequestFactory = Factory.define<PushNotificationRequest>(() => ({
	content: faker.lorem.sentences(),
	title: faker.lorem.sentence()
}));
