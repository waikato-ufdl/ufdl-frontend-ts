/**
 * Creates an initialiser function which returns a constant value.
 *
 * @param value
 *          The constant value the initialiser should return.
 * @return
 *          The initialiser function.
 */
export function constantInitialiser<T>(
    value: T
): () => T {
    return () => value
}

/**
 * Creates an initialiser which returns a new instance of a class.
 *
 * @param cls
 *          The class to initialise with.
 * @param args
 *          Any arguments to the class' constructor.
 * @return
 *          The initialiser function.
 */
export function classInitialiser<P extends readonly any[], T>(
    cls: {new(...args: P): T},
    ...args: P
): () => T {
    return () => new cls(...args);
}
