import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import type { EmailRequest } from "../../../src/types/data/EmailRequest.ts";

export const EmailRequestFactory = Factory.define<EmailRequest>(() => ({
	content: faker.lorem.sentences(),
	destinationEmail: faker.internet.email(),
	receiverName: faker.person.fullName(),
	subject: faker.lorem.sentence()
}));
