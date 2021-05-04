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
