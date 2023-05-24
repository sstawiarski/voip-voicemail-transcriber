export interface Voicemail {
	mailbox: number;
	folder: string;
	/** Integer wrapped in string */
	message_num: string;
	/** Date of voicemail in format `YYYY-MM-DD HH:MM:SS` */
	date: string;
	callerid: `${number} <${number}>`;
	duration: `${number}:${number}:${number}`;
	urgent: "yes" | "no";
	listened: "yes" | "no";
}
