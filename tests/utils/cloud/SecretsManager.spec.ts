import { describe, expect, it, vi } from "vitest";
import { SecretsManager } from "../../../src/utils/cloud/SecretsManager";

describe("SecretsManager Test Suite", () => {
	it("should successfully get and parse a string secret value to JSON", async () => {
		const TEST_SECRET_NAME = "test_secret";
		const MOCK_SECRET_VALUE = JSON.stringify({ secret: "value!" });
		const mockAccessSecretFn = vi.fn().mockImplementation((params: { name: string }) => {
			if (params.name === TEST_SECRET_NAME) {
				return [{ payload: { data: MOCK_SECRET_VALUE } }];
			}

			throw new Error();
		});

		const secretsManager = new SecretsManager({ accessSecretVersion: mockAccessSecretFn } as any, {} as any);

		const result = await secretsManager.getSecretValue(TEST_SECRET_NAME);

		expect(result).toEqual(JSON.parse(MOCK_SECRET_VALUE));
		expect(mockAccessSecretFn).toHaveBeenCalledTimes(1);
	});

    it("should successfully get and parse a Buffer secret value to JSON", async () => {
		const TEST_SECRET_NAME = "test_secret";
		const MOCK_SECRET_VALUE = Buffer.from(JSON.stringify({ secret: "value!" }));
		const mockAccessSecretFn = vi.fn().mockImplementation((params: { name: string }) => {
			if (params.name === TEST_SECRET_NAME) {
				return [{ payload: { data: MOCK_SECRET_VALUE } }];
			}

			throw new Error();
		});

		const secretsManager = new SecretsManager({ accessSecretVersion: mockAccessSecretFn } as any, {} as any);

		const result = await secretsManager.getSecretValue(TEST_SECRET_NAME);

		expect(result).toEqual(JSON.parse(MOCK_SECRET_VALUE.toString()));
		expect(mockAccessSecretFn).toHaveBeenCalledTimes(1);
	});
});
