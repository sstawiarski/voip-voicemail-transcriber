import { faker } from "@faker-js/faker";
import { Factory } from "fishery";
import type { VoicemailBox } from "../../../src/types/data/voip/VoicemailBox";

export const VoicemailBoxFactory = Factory.define<VoicemailBox>(() => ({
	email: faker.internet.email(),
	mailbox: faker.datatype.number().toString(),
	name: faker.random.word(),
	password: faker.internet.password(),
	urgent: faker.random.word(),
	new: faker.random.word()
}));
