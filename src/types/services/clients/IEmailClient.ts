import type { EmailRequest } from "../../data/EmailRequest.ts";

export interface IEmailClient {
	sendEmail: (input: EmailRequest) => Promise<void>;
}
