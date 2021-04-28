import {isArray} from "../arrays/isArray";

export default function compose<
    P extends readonly unknown[],
    R extends readonly unknown[],
    R2
>(
    a: (...args: P) => R,
    b: (...args: R) => R2
): (...args: P) => R2;

export default function compose<
    P extends readonly unknown[],
    R,
    R2
>(
    a: (...args: P) => R,
    b: (arg: R) => R2
): (...args: P) => R2;

export default function compose(
    a: (...args: readonly unknown[]) => unknown,
    b: (...args: readonly unknown[]) => unknown
): (...args: readonly unknown[]) => unknown {
    return (...args) => {
        const intermediate = a(...args);
        if (isArray(intermediate))
            return b(...args);
        else
            return b(args);
    }
}
