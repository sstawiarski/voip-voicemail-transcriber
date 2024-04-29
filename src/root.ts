import { LoggingWinston } from "@google-cloud/logging-winston";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { SpeechClient } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import axios from "axios";
import env from "env-var";
import { createContainer } from "iti";
import winston, { createLogger, format } from "winston";
import { ApplicationConstants } from "./constants/index.js";
import { AlertingService } from "./services/Alerting.js";
import { SpeechService } from "./services/Speech.js";
import { VoicemailService } from "./services/Voicemail.js";
import { EmailClient } from "./services/clients/Email.js";
import { PushNotificationClient } from "./services/clients/PushNotification.js";
import { VOIPClient } from "./services/clients/VOIP.js";
import { Logger } from "./utils/Logger.js";
import { CloudStorage } from "./utils/cloud/CloudStorage.js";
import { SecretsManager } from "./utils/cloud/SecretsManager.js";

const ENVIRONMENT = env.get("ENVIRONMENT").default("dev").asEnum(["dev", "prod", "test"]);
const LOG_LEVEL = env.get("LOG_LEVEL").default("info").asString();

export const root = createContainer()
	.add({
		winstonLogger: () => {
			const loggingWinston = new LoggingWinston({
				serviceContext: {
					service: ApplicationConstants.SERVICE_NAME
				},
				labels: {
					environment: ENVIRONMENT
				}
			});
			return createLogger({
				level: LOG_LEVEL,
				format: format.combine(format.errors({ stack: true }), format.json()),
				transports: ENVIRONMENT === "dev" ? [new winston.transports.Console(), loggingWinston] : [loggingWinston]
			});
		},
		googleSecretsClient: () => new SecretManagerServiceClient(),
		axiosInstance: () => axios.create(),
		googleSpeechClient: () => new SpeechClient(),
		googleStorage: () => new Storage()
	})
	.add(({ winstonLogger }) => ({
		logger: () => new Logger(winstonLogger)
	}))
	.add(({ googleSpeechClient, googleSecretsClient, logger, googleStorage }) => ({
		speechService: () => new SpeechService(googleSpeechClient, logger),
		secretsManager: () => new SecretsManager(googleSecretsClient, logger),
		cloudStorage: () => new CloudStorage(googleStorage, logger)
	}))
	.add(({ logger, axiosInstance, secretsManager }) => ({
		emailService: () => new EmailClient(axiosInstance, secretsManager, logger),
		pushNotificationService: () => new PushNotificationClient(axiosInstance, secretsManager, logger),
		voipService: () => new VOIPClient(axiosInstance, secretsManager, logger)
	}))
	.add(({ emailService, pushNotificationService, logger }) => ({
		alertingService: () => new AlertingService(emailService, pushNotificationService, logger)
	}))
	.add(({ speechService, alertingService, logger, voipService, cloudStorage }) => ({
		voicemailService: () => new VoicemailService(speechService, alertingService, voipService, cloudStorage, logger)
	}));

export const tokens = root.getTokens();
