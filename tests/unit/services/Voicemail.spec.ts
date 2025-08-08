// tests/unit/services/Voicemail.spec.ts

import { format, parse } from "date-fns";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { ApplicationConstants, GeneralConstants } from "../../../src/constants/index.js";
import { VoicemailService } from "../../../src/services/Voicemail.js";
import type { IVOIPClient } from "../../../src/types/services/clients/IVOIPClient.ts";
import type { IAlertingService } from "../../../src/types/services/IAlertingService.ts";
import type { ISpeechService } from "../../../src/types/services/ISpeechService.ts";
import type { ICloudStorage } from "../../../src/types/utils/cloud/ICloudStorage.ts";
import type { ILogger } from "../../../src/types/utils/ILogger.ts";
import { VoicemailFactory } from "../../utilities/factories/Voicemail.js";

describe("VoicemailService Test Suite", () => {
	// Mock dependencies
	const mockSpeechService: ISpeechService = {
		transcribe: vi.fn()
	};
	const mockAlertingService: IAlertingService = {
		sendPushNotification: vi.fn(),
		sendEmailNotification: vi.fn() // Assuming this exists per your previous suggestion
	};
	const mockVoipService: IVOIPClient = {
		getVoicemails: vi.fn(),
		getVoicemailFile: vi.fn(),
		markVoicemailRead: vi.fn(),
		getVoicemailBoxes: vi.fn() // Not used in this service, but part of the interface
	};
	const mockCloudStorage: ICloudStorage = {
		saveFile: vi.fn(),
		saveFiles: vi.fn()
	};
	const mockLogger: ILogger = {
		info: vi.fn(),
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	};

	// Instantiate the service with mocked dependencies
	let voicemailService: VoicemailService;

	beforeEach(() => {
		vi.stubEnv("VOIP_MS_TARGET_MAILBOX_ID", "12345");
		vi.stubEnv("VOICEMAIL_OUTPUT_BUCKET", "test");

		voicemailService = new VoicemailService(mockSpeechService, mockAlertingService, mockVoipService, mockCloudStorage, mockLogger);
	});

	// Reset mocks after each test
	afterEach(() => {
		vi.resetAllMocks();
	});

	it("should return 0 and log info if no voicemails are fetched", async () => {
		// Arrange
		(mockVoipService.getVoicemails as Mock).mockResolvedValue([]);

		// Act
		const result = await voicemailService.processVoicemails();

		// Assert
		expect(result).toBe(0);
		expect(mockLogger.info).toHaveBeenCalledWith("No messages found; returning...");
		expect(mockVoipService.getVoicemails).toHaveBeenCalledTimes(1);
		// Ensure no other methods were called
		expect(mockVoipService.getVoicemailFile).not.toHaveBeenCalled();
		expect(mockSpeechService.transcribe).not.toHaveBeenCalled();
		expect(mockCloudStorage.saveFiles).not.toHaveBeenCalled();
	});

	it("should return 0 if all fetched voicemails are already listened to", async () => {
		// Arrange
		const listenedMessages = VoicemailFactory.buildList(3, { listened: "yes" });
		(mockVoipService.getVoicemails as Mock).mockResolvedValue(listenedMessages);

		// Act
		const result = await voicemailService.processVoicemails();

		// Assert
		expect(result).toBe(0);
		expect(mockLogger.info).toHaveBeenCalledWith("No unread messages; returning...");
		expect(mockVoipService.getVoicemails).toHaveBeenCalledTimes(1);
		// Ensure no further processing happens
		expect(mockVoipService.getVoicemailFile).not.toHaveBeenCalled();
	});

	it("should process unread voicemails, send alerts, save files, and mark as read", async () => {
		// Arrange
		const unreadMessages = VoicemailFactory.buildList(2, { listened: "no" });
		const listenedMessages = VoicemailFactory.buildList(1, { listened: "yes" });
		const allMessages = [...unreadMessages, ...listenedMessages];

		const mockTranscription = "This is a test transcription.";
		const mockAudioData = "base64-encoded-audio-data";

		(mockVoipService.getVoicemails as Mock).mockResolvedValue(allMessages);
		(mockVoipService.getVoicemailFile as Mock).mockResolvedValue(mockAudioData);
		(mockSpeechService.transcribe as Mock).mockResolvedValue(mockTranscription);
		(mockAlertingService.sendPushNotification as Mock).mockResolvedValue(undefined);
		(mockVoipService.markVoicemailRead as Mock).mockResolvedValue(undefined);
		(mockCloudStorage.saveFiles as Mock).mockResolvedValue(undefined);

		// Act
		const result = await voicemailService.processVoicemails();

		// Assert
		expect(result).toBe(unreadMessages.length);
		expect(mockVoipService.getVoicemails).toHaveBeenCalledTimes(1);
		expect(mockVoipService.getVoicemailFile).toHaveBeenCalledTimes(unreadMessages.length);
		expect(mockSpeechService.transcribe).toHaveBeenCalledTimes(unreadMessages.length);
		expect(mockAlertingService.sendPushNotification).toHaveBeenCalledTimes(unreadMessages.length);
		expect(mockVoipService.markVoicemailRead).toHaveBeenCalledTimes(unreadMessages.length);
		expect(mockCloudStorage.saveFiles).toHaveBeenCalledTimes(1);

		// Verify the details of the calls for the first unread message
		const firstMessage = unreadMessages[0];
		const callerID = firstMessage.callerid.split(" ")[0];

		expect(mockSpeechService.transcribe).toHaveBeenCalledWith(mockAudioData);
		expect(mockAlertingService.sendPushNotification).toHaveBeenCalledWith({
			title: `New voicemail received from ${callerID}`,
			content: mockTranscription
		});
		expect(mockVoipService.markVoicemailRead).toHaveBeenCalledWith(
			expect.any(String), // TARGET_MAILBOX_ID
			firstMessage.folder,
			firstMessage.message_num
		);

		// Verify the structure of the files passed to Cloud Storage
		const savedFiles = (mockCloudStorage.saveFiles as Mock).mock.calls[0][0];
		expect(savedFiles).toHaveLength(unreadMessages.length * 2); // 1 audio + 1 text file per message

		const messageDate = parse(firstMessage.date, "yyyy-MM-dd HH:mm:ss", new Date());
		const filePrefixDate = format(messageDate, "yyyy/MM/dd");

		const expectedAudioFileName = `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${firstMessage.mailbox}_${
			firstMessage.message_num
		}_audio.${ApplicationConstants.AUDIO_FILE_EXTENSION}`;
		const expectedTranscriptionFileName = `${filePrefixDate}/${messageDate.getTime()}_from_${callerID}_${firstMessage.mailbox}_${
			firstMessage.message_num
		}_transcription.${ApplicationConstants.TRANSCRIPTION_FILE_EXTENSION}`;

		// Check that the audio file data is correct
		const audioFile = savedFiles.find((f: any) => f.destinationFileName.endsWith("_audio.wav"));
		expect(audioFile.destinationFileName).toEqual(expectedAudioFileName);
		expect(audioFile.data).toBeInstanceOf(Buffer);
		
		// Check that the transcription file data is correct
		const textFile = savedFiles.find((f: any) => f.destinationFileName.endsWith("_transcription.txt"));
		expect(textFile.destinationFileName).toEqual(expectedTranscriptionFileName);
		expect(textFile.data).toEqual(mockTranscription);
	});
});
