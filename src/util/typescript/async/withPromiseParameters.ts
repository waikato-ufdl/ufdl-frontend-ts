import {Async} from "../types/Async";
import {PossiblePromise} from "../types/promise";

export type PromiseParameters<P extends unknown[]>
    = {
        [key in keyof P]:
        P[key] extends Promise<any>
            ? never
            : PossiblePromise<P[key]>
    }

export default function withPromiseParameters<P extends unknown[], R>(
    func: (...args: P) => R
): Async<(...args: PromiseParameters<P>) => R> {
    return async function (...args: readonly unknown[]) {
        const awaitedArgs = Array(args.length) as P;

        for (let i = 0; i < args.length; i++) {
            awaitedArgs[i] = await args[i];
        }

        return func(...awaitedArgs);
    } as any;
}
