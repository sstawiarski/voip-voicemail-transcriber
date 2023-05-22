import type { SpeechClient } from "@google-cloud/speech";
import type { google } from "@google-cloud/speech/build/protos/protos";
import type { ISpeechService } from "../../src/types/services/ISpeechService";
import type { ILogger } from "../types/utils/ILogger";

export class SpeechService implements ISpeechService {
	#logger: ILogger;
	#speechClient: SpeechClient;

	constructor(speechClient: SpeechClient, logger: ILogger) {
		this.#speechClient = speechClient;
		this.#logger = logger;
	}

	public async transcribe(input: string): Promise<string> {
		try {
			const [response] = await this.#speechClient.recognize({
				audio: {
					content: input
				},
				config: {
					encoding: "LINEAR16",
					languageCode: "en-US"
				}
			});

			return this.convertResponse(response);
		} catch (error: unknown) {
			this.#logger.error("Transcription failed!");
			throw new Error("Transcription failed!");
		}
	}

	private convertResponse(input: google.cloud.speech.v1.IRecognizeResponse): string {
		if (!input.results) {
			throw new Error();
		}
		
		return input.results.map((result) => result.alternatives?.[0].transcript).join("\n");
	}
}
