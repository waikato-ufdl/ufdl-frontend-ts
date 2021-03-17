import {NTuple} from "./types/array/NTuple";
import {If} from "./types/conditional/If";
import {IsNumeric} from "./types/numeric/IsNumeric";

/**
 * Returns a version of the given function which can take an additional n
 * arguments of any type before its own arguments.
 *
 * @param n
 *          The number of additional preceding arguments to consume/ignore.
 * @param func
 *          The base function.
 * @return
 *          The modified function.
 */
export default function ignoreFirstNArgs<F extends (...args: any) => any, N extends number>(
    n: N,
    func: F
): If<
    IsNumeric<N>,
    (...args: [...NTuple<any, N>, ...Parameters<F>]) => ReturnType<F>,
    never
> {
    return (
        (...args: any) => func(...args.slice(n) as any)
    ) as any;
}
