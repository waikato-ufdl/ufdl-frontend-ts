export function constantInitialiser<T>(value: T): () => T {
    return () => value
}

export function classInitialiser<P extends readonly any[], T>(
    cls: {new(...args: P): T},
    ...args: P
): () => T {
    return () => new cls(...args);
}
