import type { AxiosInstance } from "axios";
import env from "env-var";
import { GeneralConstants } from "../../constants/index.js";
import type { PushNotificationRequest } from "../../types/data/PushNotificationRequest.ts";
import type { IPushNotificationClient } from "../../types/services/clients/IPushNotificationClient.ts";
import type { ILogger } from "../../types/utils/ILogger.ts";
import type { ISecretsManager } from "../../types/utils/cloud/ISecretsManager.ts";

const PUSHOVER_API_URL = env.get("PUSHOVER_API_URL").required().asString();
const SECRET_NAME = env.get("SECRET_NAME").required().asString();

let PUSHOVER_APP_KEY: string;
let PUSHOVER_USER_KEY: string;

export class PushNotificationClient implements IPushNotificationClient {
	#axios: AxiosInstance;
	#logger: ILogger;
	#secretsManager: ISecretsManager;

	constructor(axiosInstance: AxiosInstance, secretsManager: ISecretsManager, logger: ILogger) {
		this.#axios = axiosInstance;
		this.#secretsManager = secretsManager;
		this.#logger = logger;
	}

	public async sendPush(input: PushNotificationRequest): Promise<void> {
		const { PUSHOVER_APP_KEY, PUSHOVER_USER_KEY } = await this.getKeys();

		const formData = new FormData();
		formData.append("token", PUSHOVER_APP_KEY);
		formData.append("user", PUSHOVER_USER_KEY);
		formData.append("title", input.title);
		formData.append("message", input.content);

		try {
			await this.#axios.post(PUSHOVER_API_URL, formData, {
				headers: {
					"Content-Type": GeneralConstants.MIME_TYPES.FORM_DATA
				}
			});
		} catch (error) {
			this.#logger.error("Failed to send Pushover push notification");
			throw error;
		}
	}

	private async getKeys() {
		if (!!PUSHOVER_APP_KEY && !!PUSHOVER_USER_KEY)
			return {
				PUSHOVER_APP_KEY,
				PUSHOVER_USER_KEY
			};

		try {
			({ PUSHOVER_APP_KEY, PUSHOVER_USER_KEY } = await this.#secretsManager.getSecretValue(SECRET_NAME));
			return {
				PUSHOVER_APP_KEY,
				PUSHOVER_USER_KEY
			};
		} catch (error: unknown) {
			this.#logger.error("Failed to get secret");
			throw error;
		}
	}
}
