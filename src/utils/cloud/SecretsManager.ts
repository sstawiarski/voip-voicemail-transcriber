import type { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import type { ISecretsManager } from "../../types/utils/cloud/ISecretsManager";
import type { ILogger } from "../../types/utils/ILogger";

export class SecretsManager implements ISecretsManager {
	#secretsClient: SecretManagerServiceClient;
	#logger: ILogger;

	constructor(secretsClient: SecretManagerServiceClient, logger: ILogger) {
		this.#secretsClient = secretsClient;
		this.#logger = logger;
	}

	public async getSecretValue(secretID: string): Promise<Record<string, string>> {
		let secretPayload: string;

		try {
			const [secret] = await this.#secretsClient.accessSecretVersion({
				name: secretID
			});

			if (!secret.payload || !secret.payload.data) {
				throw new Error("Payload data not found");
			}

			if (typeof secret.payload.data === "string") {
				secretPayload = secret.payload.data;
			} else {
				secretPayload = secret.payload.data.toString();
			}
		} catch (error: unknown) {
			this.#logger.error("Secret not found or invalid data type received");
			throw error;
		}

		let parsed: Record<string, string>;
		try {
			parsed = JSON.parse(secretPayload);
		} catch (error: unknown) {
			this.#logger.error("Secret payload is not valid JSON");
			throw new Error("Secret payload is not valid JSON")
		}

		return parsed;
	}
}
