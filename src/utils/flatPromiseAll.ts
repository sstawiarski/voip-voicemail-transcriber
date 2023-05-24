export const flatPromiseAll = async <T>(input: Promise<T>[]) => {
	const results = await Promise.all(input);
	return results.flat();
};
