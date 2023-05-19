import { LoggingWinston } from "@google-cloud/logging-winston";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { SpeechClient } from "@google-cloud/speech";
import axios from "axios";
import env from "env-var";
import { createContainer } from "iti";
import winston, { createLogger, format } from "winston";
import Constants from "./constants";
import { AlertingService } from "./services/Alerting";
import { SpeechService } from "./services/Speech";
import { VoicemailService } from "./services/Voicemail";
import { EmailClient } from "./services/clients/Email";
import { PushNotificationClient } from "./services/clients/PushNotification";
import { VOIPClient } from "./services/clients/VOIP";
import { Logger } from "./utils/Logger";
import { SecretsManager } from "./utils/cloud/SecretsManager";

const ENVIRONMENT = env.get("ENVIRONMENT").default("dev").asEnum(["dev", "prod", "test"]);
const LOG_LEVEL = env.get("LOG_LEVEL").default("info").asString();

export const root = createContainer()
	.add({
		winstonLogger: () => {
			const loggingWinston = new LoggingWinston({
				serviceContext: {
					service: Constants.SERVICE_NAME
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
		speechClient: () => new SpeechClient()
	})
	.add(({ winstonLogger }) => ({
		logger: () => new Logger(winstonLogger)
	}))
	.add(({ speechClient, googleSecretsClient, logger }) => ({
		speechService: () => new SpeechService(speechClient, logger),
		secretsManager: () => new SecretsManager(googleSecretsClient, logger)
	}))
	.add(({ logger, axiosInstance, secretsManager }) => ({
		emailService: () => new EmailClient(axiosInstance, secretsManager, logger),
		pushNotificationService: () => new PushNotificationClient(axiosInstance, secretsManager, logger),
		voipService: () => new VOIPClient(axiosInstance, secretsManager, logger)
	}))
	.add(({ emailService, pushNotificationService, logger }) => ({
		alertingService: () => new AlertingService(emailService, pushNotificationService, logger)
	}))
	.add(({ speechService, alertingService, logger, voipService }) => ({
		voicemailService: () => new VoicemailService(speechService, alertingService, voipService, logger)
	}));

export const tokens = root.getTokens();
