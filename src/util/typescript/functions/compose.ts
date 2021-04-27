export default function compose<P extends readonly unknown[], R extends readonly unknown[], R2>(a: (...args: P) => R, b: (...args: R) => R2): R2;
export default function compose<P extends readonly unknown[], R, R2>(a: (...args: P) => R, b: (arg: R) => R2): R2;
export default function compose(
    a: (...args: readonly unknown[]) => unknown,
    b: (...args: readonly unknown[]) => unknown
): (...args: readonly unknown[]) => unknown {
    return (...args) => {
        return b(a(...args));
    }
}
