export function argsAsArray<P extends readonly unknown[]>(
    ...args: P
): P {
    return args;
}
