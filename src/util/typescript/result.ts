/** The type of an expression that can possibly fail. */
export type Result<T, E = any> =
    | Success<T>
    | Failure<E>

/** The expression evaluated normally. */
export type Success<T> = {
    success: true
    value: T
}

/** The expression evaluated abnormally. */
export type Failure<E = any> = {
    success: false
    error: E
}

export function result<T, E = any>(success: true, value: T): Result<T, E>;
export function result<T, E = any>(success: false, error: E): Result<T, E>;
export function result(success: boolean, valueOrError: any): Result<any> {
    if (success)
        return {
            success: true,
            value: valueOrError
        }
    else
        return {
            success: false,
            error: valueOrError
        }
}

export function catchErrorAsResult<T, E = any>(
    body: () => T
): Result<T, E> {
    try {
        return result(true, body());
    } catch (e) {
        return result(false, e);
    }
}
