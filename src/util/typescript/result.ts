/** The expression evaluated normally. */
export type Success<T> = {
    readonly success: true
    readonly value: T
    readonly error?: undefined
}

/** The expression failed to evaluate. */
export type Failure<E = unknown> = {
    readonly success: false
    readonly value?: undefined
    readonly error: E
}

/** The result-type of an expression that can possibly fail. */
export type Result<T, E = unknown> =
    | Success<T>
    | Failure<E>


/** The expression failed after completing some part. */
export type PartialSuccess<P, E = unknown> = {
    readonly success?: undefined
    readonly value?: undefined
    readonly error: E
    readonly partialResult: P
}

export type PartialResult<T, P = T, E = unknown> =
    | Result<T, E>
    | PartialSuccess<P, E>

export function result<T>(success: true, value: T): Success<T>;
export function result<E = unknown>(success: false, error: E): Failure<E>;
export function result<T, P = T, E = unknown>(success: undefined, error: E, partialResult: P): PartialSuccess<P, E>;
export function result(success: boolean | undefined, ...args: any): PartialResult<any> {
    switch (success) {
        case true: return {success: true, value: args[0]}
        case false: return {success: false, error: args[0]}
        case undefined: return {error: args[0], partialResult: args[1]}
    }
}

export function success<T>(
    value: T
): Success<T> {
    return result<T>(true, value);
}

export function failure<E>(
    error: E
): Failure<E> {
    return result(false, error);
}

export function partialSuccess<P, E = any>(
    error: E,
    partialResult: P
): PartialSuccess<P, E> {
    return result(undefined, error, partialResult);
}

export function catchErrorAsResult<P extends readonly unknown[], T, E = unknown>(
    body: (...args: P) => T
): (...args: P) => Result<T, E> {
    return (...args) => {
        try {
            return result(true, body(...args));
        } catch (e) {
            return result(false, e);
        }
    }
}

export function inlineResult<T>(
    result: Result<T>
): T {
    if (result.success)
        return result.value
    else
        throw result.error
}

export function mapValue<T2, T, P = T, E = unknown>(
    result: PartialResult<T, P, E>,
    func: (value: T) => T2
): PartialResult<T2, P, E> {
    if (result.success === true)
        return {...result, value: func(result.value)}
    else
        return result;
}

export function mapError<E2, T, P = T, E = unknown>(
    result: PartialResult<T, P, E>,
    func: (value: E) => E2
): PartialResult<T, P, E2> {
    if (result.success !== true)
        return {...result, error: func(result.error)}
    else
        return result;
}

export function mapPartialResult<P2, T, P = T, E = unknown>(
    result: PartialResult<T, P, E>,
    func: (value: P) => P2
): PartialResult<T, P2, E> {
    if (result.success === undefined)
        return {...result, partialResult: func(result.partialResult)}
    else
        return result;
}
