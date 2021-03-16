export default function callOrPass<F extends (...args: P) => R, P extends any[], R>(
    f: F | undefined
): (...args: P) => (R | undefined) {
    if (f === undefined) return () => undefined;
    return f;
}
