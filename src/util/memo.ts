import {isShallowEqual} from "./equivalency";
import {GenericFunctionWithThisArg} from "./typescript/types/GenericFunction";
import {MultiKeyMap} from "./typescript/datastructures/MultiKeyMap";

export function memo<P extends any[], R>(
    f: (...args: P) => R
): (...args: P) => R {
    let lastArgs: P | undefined = undefined;
    let lastResult: R | undefined = undefined;

    return (...args: P) => {
        if (lastResult === undefined || lastArgs === undefined || !isShallowEqual(args, lastArgs)) {
            lastArgs = args;
            lastResult = f(...args);
        }
        return lastResult;
    }
}

export function memoise<P extends Array<any>, R>(
    _: any,
    __: string,
    descriptor: TypedPropertyDescriptor<(...args: P) => R>
) {
    if (descriptor.value !== undefined) descriptor.value = memo(descriptor.value);
    if (descriptor.get !== undefined) {
        const original = descriptor.get;
        descriptor.get = () => memo(original());
    }
}

export function multiMemo<F extends GenericFunctionWithThisArg>(
    f: F
): F {
    const lookup = new MultiKeyMap();

    return new Proxy(
        f,
        {
            apply(target: F, thisArg: any, argArray?: any): any {
                const definitiveArgArray = argArray === undefined ? [] : argArray;
                let cached = lookup.get(definitiveArgArray);
                if (cached === undefined && !lookup.has(definitiveArgArray)) {
                    cached = target.apply(thisArg, argArray);
                    lookup.set(definitiveArgArray, cached);
                }
                return cached;
            }
        }
    );
}

export function memoInstances<C extends new(...args: any) => any>(
    cls: C
): C {
    const lookup = new MultiKeyMap();

    return new Proxy(
        cls,
        {
            construct(target: C, argArray: any): object {
                const definitiveArgArray = argArray === undefined ? [] : argArray;
                let cached = lookup.get(definitiveArgArray);
                if (cached === undefined && !lookup.has(definitiveArgArray)) {
                    cached = new target(...argArray);
                    lookup.set(definitiveArgArray, cached);
                }
                return cached as object;
            }
        }
    );
}