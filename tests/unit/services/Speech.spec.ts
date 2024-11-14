import type { SpeechClient } from "@google-cloud/speech";
import { describe, expect, it, vi } from "vitest";
import { SpeechService } from "../../../src/services/Speech.js";
import { TranscriptionResponseFactory } from "../../utilities/factories/TranscriptionResponse.js";

describe("SpeechService Test Suite", () => {
	it("should successfully process transcription", async () => {
		const transcriptionResponse = TranscriptionResponseFactory.build();

		const mockRecognizeFn = vi.fn().mockResolvedValue([transcriptionResponse]);
		const mockSpeechClient = {
			recognize: mockRecognizeFn
		} as unknown as SpeechClient;

		const service = new SpeechService(mockSpeechClient, {} as any);

		const transcription = await service.transcribe("");

		expect(mockRecognizeFn).toHaveBeenCalledTimes(1);
		expect(transcription).toBeTypeOf("string");
		expect(transcription.length).not.toBe(0);
		expect(transcription).toEqual(transcriptionResponse.results!.map((result) => result!.alternatives![0]!.transcript!).join("\n"));
	});

	it("should throw error when speech client throws error", async () => {
		expect.assertions(4);
		const mockLoggerErrorFn = vi.fn();

		const mockRecognizeFn = vi.fn().mockRejectedValue(new Error());
		const mockSpeechClient = {
			recognize: mockRecognizeFn
		} as unknown as SpeechClient;

		const service = new SpeechService(mockSpeechClient, { error: mockLoggerErrorFn } as any);

		try {
			await service.transcribe("");
		} catch (error: any) {
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("Transcription failed!");
			expect(mockLoggerErrorFn).toHaveBeenCalledTimes(1);
		}

		expect(mockRecognizeFn).toHaveBeenCalledTimes(1);
	});
});
