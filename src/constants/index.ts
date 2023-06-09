export const ApplicationConstants = Object.freeze({
	SERVICE_NAME: "voicemail-service",
	AUDIO_FILE_EXTENSION: "wav",
	TRANSCRIPTION_FILE_EXTENSION: "txt"
});

export const GeneralConstants = Object.freeze({
	BUFFER_FORMATS: Object.freeze({ BASE_64: "base64" }),
	AUDIO_ENCODING_FORMATS: Object.freeze({ LINEAR16: "LINEAR16" }),
	LANGUAGE_CODES: Object.freeze({
		US_ENGLISH: "en-US"
	}),
	MIME_TYPES: Object.freeze({
		PLAIN_TEXT: "text/plain",
		FORM_DATA: "multipart/form-data",
		JSON: "application/json"
	})
});
