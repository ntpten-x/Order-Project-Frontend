const inflightRequests = new Map<string, Promise<unknown>>();

export const withInflightDedup = <T>(key: string, factory: () => Promise<T>): Promise<T> => {
    const existing = inflightRequests.get(key) as Promise<T> | undefined;
    if (existing) {
        return existing;
    }

    const promise = factory().finally(() => {
        inflightRequests.delete(key);
    });

    inflightRequests.set(key, promise);
    return promise;
};
