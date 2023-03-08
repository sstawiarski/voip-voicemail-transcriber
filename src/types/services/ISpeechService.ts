export interface ISpeechService {
	transcribe: (input: string) => Promise<string>;
}
