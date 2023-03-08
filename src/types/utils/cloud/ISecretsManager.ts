export interface ISecretsManager {
	getSecretValue: (secretID: string) => Promise<Record<string, string>>;
}
