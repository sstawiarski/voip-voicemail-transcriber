export interface IVoicemailService {
	processVoicemails: () => Promise<number>;
}
