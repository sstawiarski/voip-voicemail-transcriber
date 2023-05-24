import type { Storage } from "@google-cloud/storage";
import type { ILogger } from "../../types/utils/ILogger";
import type { CloudStorageFileInput, ICloudStorage } from "../../types/utils/cloud/ICloudStorage";

export class CloudStorage implements ICloudStorage {
	#storage: Storage;
	#logger: ILogger;

	constructor(storage: Storage, logger: ILogger) {
		this.#storage = storage;
		this.#logger = logger;
	}

	public async saveFile({ data, destinationBucket, destinationFileName }: CloudStorageFileInput): Promise<void> {
		try {
			await this.#storage.bucket(destinationBucket).file(destinationFileName).save(data);
		} catch (error) {
			this.#logger.error(`Failed to save file ${destinationFileName} to bucket ${destinationBucket}`);
			throw error;
		}
	}

	public async saveFiles(input: CloudStorageFileInput[]): Promise<void> {
		await Promise.all(input.map(this.saveFile.bind(this)));
	}
}
