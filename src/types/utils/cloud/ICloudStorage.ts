export interface CloudStorageFileInput {
	data: string | Buffer;
	destinationBucket: string;
	destinationFileName: string;
}

export interface ICloudStorage {
	saveFile: (input: CloudStorageFileInput) => Promise<void>;
	saveFiles: (input: CloudStorageFileInput[]) => Promise<void>;
}
