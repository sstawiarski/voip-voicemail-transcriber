import { faker } from "@faker-js/faker";
import type { AxiosInstance } from "axios";
import type { RestoreFn } from "mocked-env";
import mockEnv from "mocked-env";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ILogger } from "../../../../src/types/utils/ILogger";
import type { ISecretsManager } from "../../../../src/types/utils/cloud/ISecretsManager";
import { VoicemailBoxFactory } from "../../../utilities/factories/VoicemailBox";

describe("VOIPClient Test Suite", () => {
	let restoreFn: RestoreFn | undefined;
	const mockVoipMsURL = "http://localhost/voip";
	const mockSecretName = "secret_name";
	const mockUsername = "test@test.com";

	const loggerInfoFn = vi.fn();
	const loggerErrorFn = vi.fn();
	const mockLogger = {
		info: loggerInfoFn,
		error: loggerErrorFn
	} as unknown as ILogger;

	beforeAll(() => {
		restoreFn = mockEnv({
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
	});

	afterAll(() => {
		restoreFn?.();
	});

	describe("getVoicemailBoxes Test Suite", () => {
		it("should throw an error when API password cannot be retrieved", async () => {
			expect.assertions(3);

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP");
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

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP");

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

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP");

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

			const { VOIPClient } = await import("../../../../src/services/clients/VOIP");

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
});
