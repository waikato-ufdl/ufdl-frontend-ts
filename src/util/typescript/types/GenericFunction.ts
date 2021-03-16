export type GenericFunction<
    P extends readonly any[] = readonly any[],
    R = void
> = (...args: P) => R

export type GenericFunctionWithThisArg<
    T = any,
    P extends readonly any[] = readonly any[],
    R = void
> = (this: T, ...args: P) => R

export type GenericAsyncFunction<
    P extends readonly any[] = readonly any[],
    R = void
> = GenericFunction<P, Promise<R>>

export type GenericAsyncFunctionWithThisArg<
    T = any,
    P extends readonly any[] = readonly any[],
    R = void
> = GenericFunctionWithThisArg<T, P, Promise<R>>
