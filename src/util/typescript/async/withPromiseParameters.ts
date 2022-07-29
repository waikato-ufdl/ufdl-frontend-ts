import {Async} from "../types/Async";
import {PossiblePromise} from "../types/promise";

/**
 * The types of the parameters to the function returned by
 * withPromiseParameters, when called with a function which
 * takes parameters P.
 */
export type PromiseParameters<P extends readonly unknown[]>
    = {
        [key in keyof P]:
        P[key] extends Promise<any>
            ? never
            : PossiblePromise<P[key]>
    }

/**
 * Higher-order function which takes a function which is asynchronous
 * (returns a promise) and return an equivalent function which can take
 * promises of it's argument values. The parameters to the source function
 * must not already take promises or this will fail.
 *
 * @param func
 *          The source function.
 * @return
 *          An equivalent function which can take promises for its arguments.
 */
export default function withPromiseParameters<P extends unknown[], R>(
    func: (...args: P) => R
): Async<(...args: PromiseParameters<P>) => R> {
    return async function (...args: readonly unknown[]) {
        // Create an array to hold the awaited values of the arguments
        const awaitedArgs = Array(args.length) as P;

        // Await each argument in turn
        for (let i = 0; i < args.length; i++) {
            awaitedArgs[i] = await args[i];
        }

        // Call the source function
        return func(...awaitedArgs);
    } as any;
}
