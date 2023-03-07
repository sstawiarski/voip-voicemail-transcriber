export interface IVoicemailService {
    processVoicemails: () => Promise<void>;
}