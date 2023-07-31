export const ApplicationConstants = Object.freeze({
	SERVICE_NAME: "voicemail-service",
	AUDIO_FILE_EXTENSION: "wav",
	TRANSCRIPTION_FILE_EXTENSION: "txt"
});

export const VoipConstants = Object.freeze({
	VOIP_MS_METHODS: Object.freeze({
		GET_VOICEMAIL_FILE: "getVoicemailMessageFile",
		MARK_LISTENED: "markListenedVoicemailMessage",
		GET_MESSAGES: "getVoicemailMessages",
		GET_VOICEMAIL_BOXES: "getVoicemails"
	}),
	VOIP_MS_STATUSES: Object.freeze({
		SUCCESS: "success",
		FAILURE: "failure",
		NO_MESSAGES: "no_messages",
		YES: "yes",
		NO: "no"
	}),
	MAILBOXES: Object.freeze({
		INBOX: "INBOX"
	})
});

export const GeneralConstants = Object.freeze({
	BUFFER_FORMATS: Object.freeze({ BASE_64: "base64" }),
	AUDIO_ENCODING_FORMATS: Object.freeze({ LINEAR16: "LINEAR16" }),
	AUDIO_FILE_EXTENSIONS: Object.freeze({
		WAV: "wav",
		MP3: "mp3"
	}),
	LANGUAGE_CODES: Object.freeze({
		US_ENGLISH: "en-US"
	}),
	MIME_TYPES: Object.freeze({
		PLAIN_TEXT: "text/plain",
		FORM_DATA: "multipart/form-data",
		JSON: "application/json"
	})
});
