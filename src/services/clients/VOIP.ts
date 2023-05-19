import type { AxiosInstance } from "axios";
import env from "env-var";
import type { Voicemail } from "../../types/data/voip/Voicemail";
import type { VoicemailBox } from "../../types/data/voip/VoicemailBox";
import type { VoicemailFile } from "../../types/data/voip/VoicemailFile";
import type { IVOIPClient } from "../../types/services/clients/IVOIPClient";
import type { ILogger } from "../../types/utils/ILogger";
import type { ISecretsManager } from "../../types/utils/cloud/ISecretsManager";

const VOIP_MS_API_USERNAME = env.get("VOIP_MS_API_USERNAME").required().asEmailString();
const VOIP_MS_API_URL = env.get("VOIP_MS_API_URL").required().asUrlString();
const SECRET_NAME = env.get("SECRET_NAME").required().asString();

let API_PASSWORD: string;

type APIWrapper<T extends Record<string, any> = {}> = ({ status: "success" } & T) | { status: "failure" };

export class VOIPClient implements IVOIPClient {
	#axios: AxiosInstance;
	#secretsManager: ISecretsManager;
	#logger: ILogger;

	constructor(axiosInstance: AxiosInstance, secretsManager: ISecretsManager, logger: ILogger) {
		this.#axios = axiosInstance;
		this.#secretsManager = secretsManager;
		this.#logger = logger;
	}

	public async getVoicemailBoxes(): Promise<VoicemailBox[]> {
		const password = await this.getAPIPassword();

		try {
			const { data } = await this.#axios.get<APIWrapper<{ voicemails: VoicemailBox[] }>>(VOIP_MS_API_URL, {
				params: {
					api_username: VOIP_MS_API_USERNAME,
					api_password: password,
					method: "getVoicemails"
				}
			});

			this.#logger.debug("Received response from VoIP API getting voicemail boxes", { ...data });

			if (data.status !== "success") {
				throw new Error();
			}

			return data.voicemails;
		} catch (error: unknown) {
			this.#logger.error("Failed to get voicemails from Voip.ms");
			throw error;
		}
	}

	public async getVoicemails(inboxID: string): Promise<Voicemail[]> {
		const password = await this.getAPIPassword();

		try {
			const { data } = await this.#axios.get<APIWrapper<{ messages: Voicemail[] }> | { status: "no_messages" }>(VOIP_MS_API_URL, {
				params: {
					api_username: VOIP_MS_API_USERNAME,
					api_password: password,
					method: "getVoicemailMessages",
					mailbox: inboxID,
					folder: "INBOX"
				}
			});

			this.#logger.debug("Received response from VOIP service getting voicemails", { ...data });

			if (data.status !== "success" && data.status !== "no_messages") {
				throw new Error();
			}

			if (data.status === "no_messages") {
				return [];
			}

			return data.messages;
		} catch (error: unknown) {
			this.#logger.error("Failed to get voicemails from Voip.ms");
			throw error;
		}
	}

	public async getVoicemailFile(inboxID: string, folderName: string, messageID: string, format: "mp3" | "wav"): Promise<string> {
		const password = await this.getAPIPassword();

		try {
			const { data } = await this.#axios.get<APIWrapper<{ message: VoicemailFile }>>(VOIP_MS_API_URL, {
				params: {
					api_username: VOIP_MS_API_USERNAME,
					api_password: password,
					method: "getVoicemailMessageFile",
					mailbox: inboxID,
					folder: folderName,
					message_num: messageID,
					format
				}
			});

			this.#logger.debug("Received response getting voicemail file", { ...data });

			if (data.status !== "success") {
				throw new Error();
			}

			return data.message.data;
		} catch (error: unknown) {
			this.#logger.error("Failed to get voicemail file from Voip.ms", { messageID, inboxID, folderName });
			throw error;
		}
	}

	public async markVoicemailRead(inboxID: string, folderName: string, messageID: string): Promise<void> {
		const password = await this.getAPIPassword();

		try {
			const { data } = await this.#axios.get<APIWrapper>(VOIP_MS_API_URL, {
				params: {
					api_username: VOIP_MS_API_USERNAME,
					api_password: password,
					method: "markListenedVoicemailMessage",
					mailbox: inboxID,
					folder: folderName,
					message_num: messageID,
					listened: "yes"
				}
			});

			if (data.status !== "success") {
				throw new Error();
			}

			return;
		} catch (error: unknown) {
			this.#logger.error("Failed to mark voicemail as read");
			throw error;
		}
	}

	private async getAPIPassword() {
		if (!!API_PASSWORD) return API_PASSWORD;

		try {
			({ VOIP_MS_API_PASSWORD: API_PASSWORD } = await this.#secretsManager.getSecretValue(SECRET_NAME));
			return API_PASSWORD;
		} catch (error: unknown) {
			this.#logger.error("Failed to get Voip.ms API password from Secrets Manager");
			throw error;
		}
	}
}
