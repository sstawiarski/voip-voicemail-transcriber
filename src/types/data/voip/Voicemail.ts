export interface Voicemail {
	mailbox: number;
	folder: string;
	message_num: string;
	date: string;
	callerid: `${number} <${number}>`;
	duration: `${number}:${number}:${number}`;
	urgent: "yes" | "no";
	listened: "yes" | "no";
}
