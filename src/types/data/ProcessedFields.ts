export interface ProcessedFields {
	to: string;
	from: string;
	text: string;
	subject: string;
	"attachment-info"?: {
		attachment1: {
			filename: string;
			name: string;
			type: string;
		};
	};
}
