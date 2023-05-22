import type { Voicemail } from "../../data/voip/Voicemail";
import type { VoicemailBox } from "../../data/voip/VoicemailBox";

export interface IVOIPClient {
	getVoicemailBoxes: () => Promise<VoicemailBox[]>;
	getVoicemails: (inboxID: string) => Promise<Voicemail[]>;
	getVoicemailFile: (inboxID: string, folderName: string, messageID: string, format: "mp3" | "wav") => Promise<string>;
	markVoicemailRead: (inboxID: string, folderName: string, messageID: string) => Promise<void>;
}
