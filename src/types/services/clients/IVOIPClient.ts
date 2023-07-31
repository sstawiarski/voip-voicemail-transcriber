import type { GeneralConstants } from "../../../constants";
import type { Voicemail } from "../../data/voip/Voicemail";
import type { VoicemailBox } from "../../data/voip/VoicemailBox";

export type AudioFormat = (typeof GeneralConstants.AUDIO_FILE_EXTENSIONS)[keyof typeof GeneralConstants.AUDIO_FILE_EXTENSIONS];

export interface IVOIPClient {
	getVoicemailBoxes: () => Promise<VoicemailBox[]>;
	getVoicemails: (inboxID: string) => Promise<Voicemail[]>;
	getVoicemailFile: (inboxID: string, folderName: string, messageID: string, format: AudioFormat) => Promise<string>;
	markVoicemailRead: (inboxID: string, folderName: string, messageID: string) => Promise<void>;
}
