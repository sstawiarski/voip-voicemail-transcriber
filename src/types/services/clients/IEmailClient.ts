import { EmailRequest } from "../../data/EmailRequest";

export interface IEmailClient {
	sendEmail: (input: EmailRequest) => Promise<void>;
}
