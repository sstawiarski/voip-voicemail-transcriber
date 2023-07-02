import type { AxiosInstance } from "axios";
import env from "env-var";
import { GeneralConstants } from "../../constants";
import type { EmailRequest } from "../../types/data/EmailRequest";
import type { IEmailClient } from "../../types/services/clients/IEmailClient";
import type { ILogger } from "../../types/utils/ILogger";
import type { ISecretsManager } from "../../types/utils/cloud/ISecretsManager";

const SENDGRID_API_URL = env.get("SENDGRID_API_URL").required().asString();
const SECRET_NAME = env.get("SECRET_NAME").required().asString();

const SENDER_NAME = env.get("EMAIL_SENDER_NAME").asString();
const SENDER_EMAIL = env.get("SENDER_EMAIL").asEmailString();

let SENDGRID_API_KEY: string;

export class EmailClient implements IEmailClient {
	#axios: AxiosInstance;
	#logger: ILogger;
	#secretsManager: ISecretsManager;

	constructor(axiosInstance: AxiosInstance, secretsManager: ISecretsManager, logger: ILogger) {
		this.#axios = axiosInstance;
		this.#secretsManager = secretsManager;
		this.#logger = logger;
	}

	public async sendEmail(input: EmailRequest): Promise<void> {
		const apiKey = await this.getAPIKey();
		const requestBody = this.createRequestBody(input);

		try {
			await this.#axios.post(SENDGRID_API_URL, requestBody, {
				headers: {
					Authorization: "Bearer " + apiKey
				}
			});
		} catch (error) {
			this.#logger.error("Failed to send to SendGrid API");
			throw error;
		}
	}

	private createRequestBody({ destinationEmail, receiverName, subject, content }: EmailRequest) {
		return {
			personalizations: [
				{
					to: [
						{
							email: destinationEmail,
							name: receiverName
						}
					],
					subject
				}
			],
			content: [{ type: GeneralConstants.MIME_TYPES.PLAIN_TEXT, value: content }],
			from: { email: SENDER_EMAIL, name: SENDER_NAME }
		};
	}

	private async getAPIKey() {
		if (!!SENDGRID_API_KEY) return SENDGRID_API_KEY;

		try {
			({ SENDGRID_API_KEY } = await this.#secretsManager.getSecretValue(SECRET_NAME));
			return SENDGRID_API_KEY;
		} catch (error: unknown) {
			this.#logger.error("Failed to get SendGrid API key");
			throw error;
		}
	}
}
