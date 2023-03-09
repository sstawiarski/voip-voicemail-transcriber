import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import type { EmailRequest } from "../../../src/types/data/EmailRequest";

export const EmailRequestFactory = Factory.define<EmailRequest>(() => ({
	content: faker.lorem.sentences(),
	destinationEmail: faker.internet.email(),
	receiverName: faker.name.fullName(),
	subject: faker.lorem.sentence()
}));
