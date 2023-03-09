import { afterEach, describe, expect, it, vi } from "vitest";
import { AlertingService } from "../../../src/services/Alerting";
import type { IEmailClient } from "../../../src/types/services/clients/IEmailClient";
import type { IPushNotificationClient } from "../../../src/types/services/clients/IPushNotificationClient";
import type { ILogger } from "../../../src/types/utils/ILogger";
import { EmailRequestFactory } from "../../utilities/factories/EmailRequest";
import { PushNotificationRequestFactory } from "../../utilities/factories/PushNotificationRequest";

describe("AlertingService Test Suite", () => {
	const loggerInfoFn = vi.fn();
	const mockLogger = {
		info: loggerInfoFn
	} as unknown as ILogger;

	afterEach(() => {
		loggerInfoFn.mockClear();
	});

	it("should successfully send email notification", async () => {
		const mockSendEmailFn = vi.fn().mockResolvedValue(void 0);

		const mockEmailClient = {
			sendEmail: mockSendEmailFn
		} as unknown as IEmailClient;

		const alertingService = new AlertingService(mockEmailClient, {} as any, mockLogger);
		const request = EmailRequestFactory.build();

		await alertingService.sendEmailNotification(request);

		expect(mockSendEmailFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenLastCalledWith("Sending email notification...");
	});

	it("should throw the original error when send email notification fails", async () => {
		expect.assertions(4);

		const mockError = new Error("test");
		const mockSendEmailFn = vi.fn().mockRejectedValue(mockError);

		const mockEmailClient = {
			sendEmail: mockSendEmailFn
		} as unknown as IEmailClient;

		const alertingService = new AlertingService(mockEmailClient, {} as any, mockLogger);
		const request = EmailRequestFactory.build();

		try {
			await alertingService.sendEmailNotification(request);
		} catch (error) {
			expect(error === mockError).toEqual(true);
		}

		expect(mockSendEmailFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenLastCalledWith("Sending email notification...");
	});

	it("should successfully send push notification", async () => {
		const mockSendPushNotificationFn = vi.fn().mockResolvedValue(void 0);

		const mockPushClient = {
			sendPush: mockSendPushNotificationFn
		} as unknown as IPushNotificationClient;

		const alertingService = new AlertingService({} as any, mockPushClient, mockLogger);
		const request = PushNotificationRequestFactory.build();

		await alertingService.sendPushNotification(request);

		expect(mockSendPushNotificationFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenLastCalledWith("Sending push notification...");
	});

	it("should throw the original error when send email notification fails", async () => {
		expect.assertions(4);

		const mockError = new Error("test");
		const mockSendPushFn = vi.fn().mockRejectedValue(mockError);

		const mockPushClient = {
			sendPush: mockSendPushFn
		} as unknown as IPushNotificationClient;

		const alertingService = new AlertingService({} as any, mockPushClient, mockLogger);
		const request = PushNotificationRequestFactory.build();

		try {
			await alertingService.sendPushNotification(request);
		} catch (error) {
			expect(error === mockError).toEqual(true);
		}

		expect(mockSendPushFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenCalledTimes(1);
		expect(loggerInfoFn).toHaveBeenLastCalledWith("Sending push notification...");
	});
});
