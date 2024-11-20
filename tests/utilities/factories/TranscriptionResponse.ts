import { faker } from "@faker-js/faker";
import { google } from "@google-cloud/speech/build/protos/protos.js";
import { Factory } from "fishery";

export const TranscriptionResponseFactory = Factory.define<google.cloud.speech.v1.IRecognizeResponse>(() => ({
	results: new Array(5).fill(null).map(() => ({
		alternatives: [
			{
				transcript: faker.lorem.sentence()
			}
		]
	}))
}));
