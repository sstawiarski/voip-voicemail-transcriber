import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import type { VoicemailBox } from "../../../src/types/data/voip/VoicemailBox";

export const VoicemailBoxFactory = Factory.define<VoicemailBox>(() => ({
	email: faker.internet.email(),
	mailbox: faker.number.int().toString(),
	name: faker.lorem.word(),
	password: faker.internet.password(),
	urgent: faker.lorem.word(),
	new: faker.lorem.word()
}));
