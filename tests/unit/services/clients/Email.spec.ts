import type { AxiosInstance } from "axios";
import type { RestoreFn } from "mocked-env";
import mockEnv from "mocked-env";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { GeneralConstants } from "../../../../src/constants/index.js";
import type { ILogger } from "../../../../src/types/utils/ILogger.ts";
import type { ISecretsManager } from "../../../../src/types/utils/cloud/ISecretsManager.ts";
import { EmailRequestFactory } from "../../../utilities/factories/EmailRequest.js";

describe("EmailClient Test Suite", () => {
	let restoreFn: RestoreFn | undefined;
	const mockSendGridUrl = "http://localhost/sendgrid";
	const mockSecretName = "secret_name";

	const loggerInfoFn = vi.fn();
	const loggerErrorFn = vi.fn();
	const mockLogger = {
		info: loggerInfoFn,
		error: loggerErrorFn
	} as unknown as ILogger;

	beforeAll(() => {
		restoreFn = (mockEnv as any)({
			SENDGRID_API_URL: mockSendGridUrl,
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

	it("should successfully call SendGrid API to send email", async () => {
		/* Dynamic import to ensure file globals are set by the mock env */
		const { EmailClient } = await import("../../../../src/services/clients/Email.js");

		const mockPostFn = vi.fn().mockResolvedValue(void 0);
		const mockAxios = {
			post: mockPostFn
		} as unknown as AxiosInstance;

		const mockGetSecretValue = vi.fn().mockResolvedValue({ SENDGRID_API_KEY: "test_key" });
		const mockSecretsManager = {
			getSecretValue: mockGetSecretValue
		} as unknown as ISecretsManager;

		const client = new EmailClient(mockAxios, mockSecretsManager, {} as any);
		const mockEmail = EmailRequestFactory.build();
		await client.sendEmail(mockEmail);

		expect(mockPostFn).toHaveBeenCalledTimes(1);
		expect(mockPostFn).toHaveBeenLastCalledWith(
			mockSendGridUrl,
			expect.objectContaining({
				content: [
					{
						type: GeneralConstants.MIME_TYPES.PLAIN_TEXT,
						value: mockEmail.content
					}
				]
			}),
			expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test_key" }) })
		);
		expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
		expect(mockGetSecretValue).toHaveBeenLastCalledWith(mockSecretName);
	});

	it("should throw error when POST request fails", async () => {
		expect.assertions(2);

		const { EmailClient } = await import("../../../../src/services/clients/Email.js");

		const mockError = new Error("test");
		const mockPostFn = vi.fn().mockRejectedValue(mockError);
		const mockAxios = {
			post: mockPostFn
		} as unknown as AxiosInstance;

		const mockGetSecretValue = vi.fn().mockResolvedValue({ SENDGRID_API_KEY: "test_key" });
		const mockSecretsManager = {
			getSecretValue: mockGetSecretValue
		} as unknown as ISecretsManager;

		const client = new EmailClient(mockAxios, mockSecretsManager, mockLogger);

		try {
			await client.sendEmail(EmailRequestFactory.build());
		} catch (error) {
			expect(error === mockError).toEqual(true);
		}

		expect(mockGetSecretValue).toHaveBeenCalledTimes(1);
	});
});
