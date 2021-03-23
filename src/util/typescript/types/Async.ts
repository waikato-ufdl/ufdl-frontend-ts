export type Async<F extends (...args: any) => any>
    = ReturnType<F> extends Promise<any>
        ? F
        : (...args: Parameters<F>) => Promise<ReturnType<F>>
