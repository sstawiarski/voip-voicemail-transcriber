import { faker } from "@faker-js/faker";
import type { AxiosInstance } from "axios";
import type { RestoreFn } from "mocked-env";
import mockEnv from "mocked-env";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ILogger } from "../../../../src/types/utils/ILogger.ts";
import type { ISecretsManager } from "../../../../src/types/utils/cloud/ISecretsManager.ts";
import { VoicemailFactory } from "../../../utilities/factories/Voicemail.js";
import { VoicemailBoxFactory } from "../../../utilities/factories/VoicemailBox.js";

describe("VOIPClient Test Suite", () => {
	let restoreFn: RestoreFn | undefined;
	const mockVoipMsURL = "http://localhost/voip";
	const mockSecretName = "secret_name";
	const mockUsername = "test@test.com";

	const loggerInfoFn = vi.fn();
	const loggerErrorFn = vi.fn();
	const loggerDebugFn = vi.fn();
	const mockLogger = {
		info: loggerInfoFn,
		error: loggerErrorFn,
		debug: loggerDebugFn
	} as unknown as ILogger;

	beforeAll(() => {
		restoreFn = (mockEnv as any)({
			VOIP_MS_API_URL: mockVoipMsURL,
			SECRET_NAME: mockSecretName,
			VOIP_MS_API_USERNAME: mockUsername
		});
	});

	afterEach(() => {
		/* Reset modules so saved globals (e.g. cached secret value) do not conflict between tests */
		vi.resetModules();

		loggerInfoFn.mockClear();
		loggerErrorFn.mockClear();
		loggerDebugFn.mockClear();
	});

	afterAll(() => {
		restoreFn?.();
	});

	describe("getVoicemailBoxes Test Suite", () => {
		it("should throw an error when API password cannot be retrieved", async () => {
			expect.assertions(3);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");
			const mockError = new Error();
			const mockGetSecretValue = vi.fn().mockRejectedValue(mockError);
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const client = new VOIPClient({} as any, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemailBoxes();
			} catch (error: any) {
				expect(error === mockError).toEqual(true);
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get Voip.ms API password from Secrets Manager");
			}
		});

		it("should throw an error when API call fails", async () => {
			expect.assertions(5);
			const mockPassword = faker.internet.password();

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockError = new Error();
			const mockGet = vi.fn().mockRejectedValue(mockError);
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemailBoxes();
			} catch (error: any) {
				expect(error === mockError).toEqual(true);
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get voicemails from Voip.ms");
				expect(mockGet).toHaveBeenCalledTimes(1);
				expect(mockGet).toHaveBeenLastCalledWith(mockVoipMsURL, {
					params: {
						api_username: mockUsername,
						api_password: mockPassword,
						method: "getVoicemails"
					}
				});
			}
		});

		it("should throw an error when API call succeeds but response.status is not 'success'", async () => {
			expect.assertions(4);
			const mockPassword = faker.internet.password();

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockGet = vi.fn().mockResolvedValue({ data: { status: "failed" } });
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemailBoxes();
			} catch (error: any) {
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get voicemails from Voip.ms");
				expect(mockGet).toHaveBeenCalledTimes(1);
				expect(mockGet).toHaveBeenLastCalledWith(mockVoipMsURL, {
					params: {
						api_username: mockUsername,
						api_password: mockPassword,
						method: "getVoicemails"
					}
				});
			}
		});

		it("should successfully get mailboxes", async () => {
			const mockPassword = faker.internet.password();

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockVoicemailBoxes = new Array(5).fill(null).map(() => VoicemailBoxFactory.build());

			const mockGet = vi.fn().mockResolvedValue({ data: { status: "success", voicemails: mockVoicemailBoxes } });
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			const result = await client.getVoicemailBoxes();

			expect(Array.isArray(result)).toEqual(true);
			expect(result.length).toEqual(5);
		});
	});

	describe("getVoicemails Test Suite", () => {
		it("should throw an error when API password cannot be retrieved", async () => {
			expect.assertions(3);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");
			const mockError = new Error();
			const mockGetSecretValue = vi.fn().mockRejectedValue(mockError);
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockInboxId = faker.number.int({ max: 10000 }).toString(10);

			const client = new VOIPClient({} as any, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemails(mockInboxId);
			} catch (error: any) {
				expect(error === mockError).toEqual(true);
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get Voip.ms API password from Secrets Manager");
			}
		});

		it("should throw an error when API call fails", async () => {
			expect.assertions(5);
			const mockPassword = faker.internet.password();
			const mockInboxId = faker.number.int({ max: 10000 }).toString(10);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockError = new Error();
			const mockGet = vi.fn().mockRejectedValue(mockError);
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemails(mockInboxId);
			} catch (error: any) {
				expect(error === mockError).toEqual(true);
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get voicemails from Voip.ms");
				expect(mockGet).toHaveBeenCalledTimes(1);
				expect(mockGet).toHaveBeenLastCalledWith(mockVoipMsURL, {
					params: {
						api_username: mockUsername,
						api_password: mockPassword,
						method: "getVoicemailMessages",
						mailbox: mockInboxId,
						folder: "INBOX"
					}
				});
			}
		});

		it("should throw an error when API call succeeds but response.status is not 'success'", async () => {
			expect.assertions(4);
			const mockPassword = faker.internet.password();
			const mockInboxId = faker.number.int({ max: 10000 }).toString(10);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockGet = vi.fn().mockResolvedValue({ data: { status: "failed" } });
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			try {
				await client.getVoicemails(mockInboxId);
			} catch (error: any) {
				expect(mockLogger.error).toHaveBeenCalledTimes(1);
				expect(mockLogger.error).toHaveBeenLastCalledWith("Failed to get voicemails from Voip.ms");
				expect(mockGet).toHaveBeenCalledTimes(1);
				expect(mockGet).toHaveBeenLastCalledWith(mockVoipMsURL, {
					params: {
						api_username: mockUsername,
						api_password: mockPassword,
						method: "getVoicemailMessages",
						mailbox: mockInboxId,
						folder: "INBOX"
					}
				});
			}
		});

		it("should return an empty array when status is 'no_messages'", async () => {
			const mockPassword = faker.internet.password();
			const mockInboxId = faker.number.int({ max: 10000 }).toString(10);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockGet = vi.fn().mockResolvedValue({ data: { status: "no_messages" } });
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			const result = await client.getVoicemails(mockInboxId);

			expect(Array.isArray(result)).toEqual(true);
			expect(result.length).toEqual(0);
		});

		it("should successfully return messages when status is 'success'", async () => {
			const mockPassword = faker.internet.password();
			const mockInboxId = faker.number.int({ max: 10000 }).toString(10);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP.js");

			const mockGetSecretValue = vi.fn().mockResolvedValue({ VOIP_MS_API_PASSWORD: mockPassword });
			const mockSecretsManager = {
				getSecretValue: mockGetSecretValue
			} as unknown as ISecretsManager;

			const mockVoicemailMessages = new Array(5).fill(null).map(() => VoicemailFactory.build());

			const mockGet = vi.fn().mockResolvedValue({ data: { status: "success", messages: mockVoicemailMessages } });
			const mockAxios = {
				get: mockGet
			} as unknown as AxiosInstance;

			const client = new VOIPClient(mockAxios, mockSecretsManager, mockLogger);

			const result = await client.getVoicemails(mockInboxId);

			expect(Array.isArray(result)).toEqual(true);
			expect(result.length).toEqual(mockVoicemailMessages.length);
		});
	});
});
