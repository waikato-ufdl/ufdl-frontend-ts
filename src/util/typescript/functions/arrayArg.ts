/**
 * Converts a function into a variant which takes its arguments as a
 * single array parameter.
 *
 * @param f
 *          The function to convert.
 * @return
 *          The array-parameterised equivalent of f.
 */
export default function arrayArg<P extends readonly unknown[], R>(
    f: (...args: P) => R
): (arrayArg: P) => R {
    return arrayArg => f(...arrayArg)
}
