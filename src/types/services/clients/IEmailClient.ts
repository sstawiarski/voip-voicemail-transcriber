import type { EmailRequest } from "../../data/EmailRequest";

export interface IEmailClient {
	sendEmail: (input: EmailRequest) => Promise<void>;
}
