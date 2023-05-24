import { describe, expect, it, vi } from "vitest";
import { CloudStorage } from "../../../../src/utils/cloud/CloudStorage";

describe("CloudStorage Test Suite", () => {
	describe("saveFile Test Suite", () => {
		it("should successfully save a file", async () => {
			const mockData = "data";
			const mockDestinationBucket = "test_bucket";
			const mockFilename = "test_filename";

			const mockSaveFn = vi.fn().mockResolvedValue(void 0);
			const mockFileFn = vi.fn().mockImplementation(() => {
				return { save: mockSaveFn };
			});
			const mockBucketFn = vi.fn().mockImplementation(() => {
				return { file: mockFileFn };
			});

			const cloudStorage = new CloudStorage({ bucket: mockBucketFn } as any, {} as any);

			await cloudStorage.saveFile({ data: mockData, destinationBucket: mockDestinationBucket, destinationFileName: mockFilename });

			expect(mockBucketFn).toHaveBeenCalledTimes(1);
			expect(mockBucketFn).toHaveBeenLastCalledWith(mockDestinationBucket);
			expect(mockFileFn).toHaveBeenCalledTimes(1);
			expect(mockFileFn).toHaveBeenLastCalledWith(mockFilename);
			expect(mockSaveFn).toHaveBeenCalledTimes(1);
			expect(mockSaveFn).toHaveBeenLastCalledWith(mockData);
		});

		it("should log and throw error when saving fails", async () => {
			expect.assertions(8);

			const mockData = "data";
			const mockDestinationBucket = "test_bucket";
			const mockFilename = "test_filename";
			const mockError = new Error("mock error");

			const mockSaveFn = vi.fn().mockRejectedValue(mockError);
			const mockFileFn = vi.fn().mockImplementation(() => {
				return { save: mockSaveFn };
			});
			const mockBucketFn = vi.fn().mockImplementation(() => {
				return { file: mockFileFn };
			});

			const mockLoggerErrorFn = vi.fn();

			const cloudStorage = new CloudStorage({ bucket: mockBucketFn } as any, { error: mockLoggerErrorFn } as any);

			try {
				await cloudStorage.saveFile({ data: mockData, destinationBucket: mockDestinationBucket, destinationFileName: mockFilename });
			} catch (error) {
				expect(error === mockError).toEqual(true);
				expect(mockLoggerErrorFn).toHaveBeenCalledTimes(1);
				expect(mockBucketFn).toHaveBeenCalledTimes(1);
				expect(mockBucketFn).toHaveBeenLastCalledWith(mockDestinationBucket);
				expect(mockFileFn).toHaveBeenCalledTimes(1);
				expect(mockFileFn).toHaveBeenLastCalledWith(mockFilename);
				expect(mockSaveFn).toHaveBeenCalledTimes(1);
				expect(mockSaveFn).toHaveBeenLastCalledWith(mockData);
			}
		});
	});

    describe("saveFiles Test Suite", () => {
		it("should successfully save multiple files", async () => {
			const mockData = "data";
			const mockDestinationBucket = "test_bucket";
			const mockFilename = "test_filename";

			const mockSaveFn = vi.fn().mockResolvedValue(void 0);
			const mockFileFn = vi.fn().mockImplementation(() => {
				return { save: mockSaveFn };
			});
			const mockBucketFn = vi.fn().mockImplementation(() => {
				return { file: mockFileFn };
			});

			const cloudStorage = new CloudStorage({ bucket: mockBucketFn } as any, {} as any);

			await cloudStorage.saveFiles([{ data: mockData, destinationBucket: mockDestinationBucket, destinationFileName: mockFilename }, { data: mockData, destinationBucket: mockDestinationBucket, destinationFileName: mockFilename }]);

			expect(mockBucketFn).toHaveBeenCalledTimes(2);
			expect(mockBucketFn).toHaveBeenLastCalledWith(mockDestinationBucket);
			expect(mockFileFn).toHaveBeenCalledTimes(2);
			expect(mockFileFn).toHaveBeenLastCalledWith(mockFilename);
			expect(mockSaveFn).toHaveBeenCalledTimes(2);
			expect(mockSaveFn).toHaveBeenLastCalledWith(mockData);
		});

		it("should log and throw error when saving fails", async () => {
			expect.assertions(8);

			const mockData = "data";
			const mockDestinationBucket = "test_bucket";
			const mockFilename = "test_filename";
			const mockError = new Error("mock error");

			const mockSaveFn = vi.fn().mockRejectedValue(mockError);
			const mockFileFn = vi.fn().mockImplementation(() => {
				return { save: mockSaveFn };
			});
			const mockBucketFn = vi.fn().mockImplementation(() => {
				return { file: mockFileFn };
			});

			const mockLoggerErrorFn = vi.fn();

			const cloudStorage = new CloudStorage({ bucket: mockBucketFn } as any, { error: mockLoggerErrorFn } as any);

			try {
				await cloudStorage.saveFiles([{ data: mockData, destinationBucket: mockDestinationBucket, destinationFileName: mockFilename }]);
			} catch (error) {
				expect(error === mockError).toEqual(true);
				expect(mockLoggerErrorFn).toHaveBeenCalledTimes(1);
				expect(mockBucketFn).toHaveBeenCalledTimes(1);
				expect(mockBucketFn).toHaveBeenLastCalledWith(mockDestinationBucket);
				expect(mockFileFn).toHaveBeenCalledTimes(1);
				expect(mockFileFn).toHaveBeenLastCalledWith(mockFilename);
				expect(mockSaveFn).toHaveBeenCalledTimes(1);
				expect(mockSaveFn).toHaveBeenLastCalledWith(mockData);
			}
		});
	});
});
