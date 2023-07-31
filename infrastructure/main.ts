import {
	cloudRunV2ServiceIamMember,
	cloudfunctions2Function,
	cloudfunctions2FunctionIamMember,
	provider,
	secretManagerSecret,
	storageBucket,
	storageBucketObject
} from "@cdktf/provider-google";
import { App, GcsBackend, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { get } from "env-var";
import { resolve } from "node:path";
import { ServiceAccount } from "./constructs/ServiceAccount";
import { StorageBucket } from "./constructs/StorageBucket";
const isCI = require("is-ci");

const environment = get("ENVIRONMENT").default("dev").asEnum(["dev", "prod"]);
let voicemailBucketSuffix = get("VOICEMAIL_OUTPUT_BUCKET_SUFFIX").default("").asString();
let functionArtifactBucketName = get("FN_ARTIFACT_BUCKET_NAME").default("").asString();
let tfBucket = get("TF_BUCKET").default("").asString();
let alertSenderEmail = get("ALERT_SENDER_EMAIL").default("test@test.com").asEmailString();
let voipAPIUsername = get("VOIP_MS_API_USERNAME").default("").asString();
let targetVoipMailboxID = get("VOIP_MS_TARGET_MAILBOX_ID").default("").asString();

interface VoicemailServiceStackConfig {
	environment: string;
	region: string;
	fnArtifactBucket: string;
	voicemailBucketSuffix: string;
	alertSenderEmail: string;
	voipAPIUsername: string;
	targetVoipMailboxID: string;
}

class VoicemailServiceStack extends TerraformStack {
	constructor(scope: Construct, id: string, config: VoicemailServiceStackConfig) {
		super(scope, id);

		console.log(config.fnArtifactBucket)

		const PROJECT_ID = `${config.environment}-voicemail-service`;

		new provider.GoogleProvider(this, "google-provider", {
			project: PROJECT_ID,
			region: config.region,
			...(!isCI ? { credentials: resolve(__dirname, "credentials", `${config.environment}.json`) } : {})
		});

		/** Secrets */
		const secrets = new secretManagerSecret.SecretManagerSecret(this, "secrets", {
			secretId: `${config.environment}-voicemail-secrets`,
			replication: {
				userManaged: {
					replicas: [
						{
							location: config.region
						}
					]
				}
			}
		});

		/** Service Account */
		const handlerServiceAccount = new ServiceAccount(this, "handler-service-account", {
			accountId: `${config.environment}-voicemail-handler-service`,
			displayName: "Voicemail Handler Service Account",
			project: PROJECT_ID,
			roles: ["roles/secretmanager.secretAccessor", "roles/logging.logWriter", "roles/speech.client"]
		});

		/** Buckets */
		const artifactBucket = new storageBucket.StorageBucket(this, "function-artifacts", {
			name: config.fnArtifactBucket,
			location: "US"
		});

		const voicemailOutputBucket = new StorageBucket(this, "voicemail-outputs", {
			name: `${config.environment}-voicemail-outputs-${config.voicemailBucketSuffix}`,
			location: "US",
			permissions: [
				{
					member: `serviceAccount:${handlerServiceAccount.email}`,
					role: "roles/storage.objectCreator"
				}
			]
		});
		/** Functions and Artifacts */
		const voicemailHandlerCodeObject = new storageBucketObject.StorageBucketObject(this, "voicemail-handler-code", {
			name: `${config.environment}-voicemail-handler/${Date.now()}.zip`,
			bucket: artifactBucket.name,
			source: resolve(__dirname, "..", "functions.zip")
		});

		const voicemailHandlerFn = new cloudfunctions2Function.Cloudfunctions2Function(this, "voicemail-handler", {
			name: `${config.environment}-voicemail-handler`,
			location: config.region,
			buildConfig: {
				runtime: "nodejs18",
				entryPoint: "voicemail_handler",
				source: {
					storageSource: {
						bucket: artifactBucket.name,
						object: voicemailHandlerCodeObject.name
					}
				}
			},
			serviceConfig: {
				serviceAccountEmail: handlerServiceAccount.email,
				maxInstanceCount: 1,
				availableMemory: "256M",
				timeoutSeconds: 60,
				environmentVariables: {
					SENDGRID_API_URL: "https://api.sendgrid.com/v3/mail/send",
					EMAIL_SENDER_NAME: "Voicemails",
					SENDER_EMAIL: config.alertSenderEmail,
					PUSHOVER_API_URL: "https://api.pushover.net/1/messages.json",
					LOG_LEVEL: config.environment === "dev" ? "debug" : "info",
					SECRET_NAME: `${secrets.name}/versions/latest`,
					VOIP_MS_API_URL: "https://voip.ms/api/v1/rest.php",
					VOIP_MS_API_USERNAME: config.voipAPIUsername,
					VOIP_MS_TARGET_MAILBOX_ID: config.targetVoipMailboxID,
					ENVIRONMENT: config.environment,
					VOICEMAIL_OUTPUT_BUCKET: voicemailOutputBucket.name
				}
			}
		});

		new cloudfunctions2FunctionIamMember.Cloudfunctions2FunctionIamMember(this, "function-iam", {
			cloudFunction: voicemailHandlerFn.name,
			role: "roles/cloudfunctions.invoker",
			member: "allUsers",
			location: voicemailHandlerFn.location
		});

		new cloudRunV2ServiceIamMember.CloudRunV2ServiceIamMember(this, "cloud-run-invoke", {
			name: voicemailHandlerFn.nameInput!,
			member: "allUsers",
			role: "roles/run.invoker",
			location: voicemailHandlerFn.location
		});
	}
}

function synth() {
	const app = new App();
	const stack = new VoicemailServiceStack(app, "infrastructure", {
		environment,
		region: process.env.GCP_REGION ?? "us-central1",
		fnArtifactBucket: functionArtifactBucketName,
		voicemailBucketSuffix,
		alertSenderEmail,
		targetVoipMailboxID,
		voipAPIUsername
	});

	new GcsBackend(stack, {
		bucket: tfBucket,
		prefix: "terraform/state"
	});
	app.synth();
}

/** Load local overrides if applicable */
if (!isCI) {
	import("dotenv")
		.then(({ config }) => config())
		.then(() => {
			tfBucket = get(environment === "dev" ? "DEV_TF_BUCKET" : "PROD_TF_BUCKET")
				.default("")
				.asString();
			functionArtifactBucketName = get(environment === "dev" ? "DEV_FUNCTION_ARTIFACT_BUCKET_NAME" : "PROD_FUNCTION_ARTIFACT_BUCKET_NAME")
				.required()
				.asString();
			voicemailBucketSuffix = get("VOICEMAIL_OUTPUT_BUCKET_SUFFIX").required().asString();
			targetVoipMailboxID = get("VOIP_MS_TARGET_MAILBOX_ID").required().asString();
			alertSenderEmail = get("ALERT_SENDER_EMAIL").required().asEmailString();
			voipAPIUsername = get("VOIP_MS_API_USERNAME").required().asString();

			synth();
		});
} else {
	synth();
}
