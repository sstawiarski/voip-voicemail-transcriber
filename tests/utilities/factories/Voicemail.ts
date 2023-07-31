import { faker } from "@faker-js/faker";
import { format } from "date-fns";
import { Factory } from "fishery";
import type { Voicemail } from "../../../src/types/data/voip/Voicemail";

export const VoicemailFactory = Factory.define<Voicemail>(() => ({
	email: faker.internet.email(),
	mailbox: faker.number.int({ max: 100000 }),
	name: faker.lorem.word(),
	password: faker.internet.password(),
	new: faker.lorem.word(),
	folder: "INBOX",
	callerid: `${faker.number.int({ min: 1000000000, max: 9999999999 })} <${faker.number.int({ min: 1000000000, max: 9999999999 })}>`,
	date: format(faker.date.recent(), "yyyy-MM-dd HH:MM:SS"),
	duration: `${faker.number.int({ max: 1000 })}:${faker.number.int({ max: 59 })}:${faker.number.int({ max: 59 })}`,
	listened: faker.helpers.arrayElement(["yes", "no"]),
	urgent: faker.helpers.arrayElement(["yes", "no"]),
	message_num: faker.number.int({ max: 100 }).toString(10)
}));
