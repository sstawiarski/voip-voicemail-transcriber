import type { AxiosInstance } from "axios";
import type { RestoreFn } from "mocked-env";
import mockEnv from "mocked-env";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GeneralConstants } from "../../../../src/constants";
import type { ILogger } from "../../../../src/types/utils/ILogger";
import type { ISecretsManager } from "../../../../src/types/utils/cloud/ISecretsManager";
import { PushNotificationRequestFactory } from "../../../utilities/factories/PushNotificationRequest";

/**
 * @vitest-environment jsdom
 */

describe("PushNotificationClient Test Suite", () => {
	let restoreFn: RestoreFn | undefined;
	const mockPushoverUrl = "http://localhost/pushover";
	const mockSecretName = "secret_name";

	const loggerInfoFn = vi.fn();
	const loggerErrorFn = vi.fn();
	const mockLogger = {
		info: loggerInfoFn,
		error: loggerErrorFn
	} as unknown as ILogger;

	beforeAll(() => {
		restoreFn = mockEnv({
			PUSHOVER_API_URL: mockPushoverUrl,
			SECRET_NAME: mockSecretName
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

	it("should successfully call Pushover API to send push notification", async () => {
		/* Dynamic import to ensure file globals are set by the mock env */
		const { PushNotificationClient } = await import("../../../../src/services/clients/PushNotification");

		const mockPostFn = vi.fn().mockResolvedValue(void 0);
		const mockAxios = {
			post: mockPostFn
		} as unknown as AxiosInstance;

		const mockGetSecretValue = vi.fn().mockResolvedValue({ PUSHOVER_APP_KEY: "test_key", PUSHOVER_USER_KEY: "test_key_two" });
		const mockSecretsManager = {
			getSecretValue: mockGetSecretValue
		} as unknown as ISecretsManager;

		const client = new PushNotificationClient(mockAxios, mockSecretsManager, {} as any);
		const mockPush = PushNotificationRequestFactory.build();
		await client.sendPush(mockPush);

		expect(mockPostFn).toHaveBeenCalledTimes(1);
		expect(mockPostFn).toHaveBeenLastCalledWith(
			mockPushoverUrl,
			expect.any(FormData),
			expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": GeneralConstants.MIME_TYPES.FORM_DATA }) })
		);
		expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
		expect(mockGetSecretValue).toHaveBeenLastCalledWith(mockSecretName);
	});

	it("should throw error when POST request fails", async () => {
		expect.assertions(2);

		const { PushNotificationClient } = await import("../../../../src/services/clients/PushNotification");

		const mockError = new Error("test");
		const mockPostFn = vi.fn().mockRejectedValue(mockError);
		const mockAxios = {
			post: mockPostFn
		} as unknown as AxiosInstance;

		const mockGetSecretValue = vi.fn().mockResolvedValue({ PUSHOVER_APP_KEY: "test_key", PUSHOVER_USER_KEY: "test_key_two" });
		const mockSecretsManager = {
			getSecretValue: mockGetSecretValue
		} as unknown as ISecretsManager;

		const client = new PushNotificationClient(mockAxios, mockSecretsManager, mockLogger);

		try {
			await client.sendPush(PushNotificationRequestFactory.build());
		} catch (error) {
			expect(error === mockError).toEqual(true);
		}

		expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
	});
});
