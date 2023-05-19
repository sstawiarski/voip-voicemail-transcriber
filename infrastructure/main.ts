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
const isCI = require("is-ci");

const environment = get("ENVIRONMENT").default("dev").asEnum(["dev", "prod"]);

let tfBucket = get("TF_BUCKET").default("").asString();

if (!isCI) {
	import("dotenv")
		.then(({ config }) => config())
		.then(() => {
			tfBucket = get(environment === "dev" ? "DEV_TF_BUCKET" : "PROD_TF_BUCKET")
				.default("")
				.asString();
			synth();
		});
} else {
	synth();
}

function synth() {
	const app = new App();
	const stack = new VoicemailServiceStack(app, "infrastructure", { environment, region: process.env.GCP_REGION ?? "us-central1" });

	new GcsBackend(stack, {
		bucket: tfBucket,
		prefix: "terraform/state"
	});
	app.synth();
}

class VoicemailServiceStack extends TerraformStack {
	constructor(scope: Construct, id: string, config: { environment: string; region: string }) {
		super(scope, id);

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
			name: "function-artifacts",
			location: "US"
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
					SENDER_EMAIL: "voicemails@shawnstawiarski.com",
					PUSHOVER_API_URL: "https://api.pushover.net/1/messages.json",
					LOG_LEVEL: "info",
					SECRET_NAME: `${secrets.name}/versions/latest`,
					VOIP_MS_API_URL: "https://voip.ms/api/v1/rest.php",
					VOIP_MS_API_USERNAME: "contact@shawnstawiarski.com",
					VOIP_MS_TARGET_MAILBOX_ID: "19085"
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
