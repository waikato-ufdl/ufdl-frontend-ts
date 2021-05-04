import {Result} from "../result";

/**
 * Returns a promise that never fails, but instead returns
 * a [Result] type with the value/error.
 *
 * @param promise
 *          The promise to convert.
 * @return
 *          A promise of an equivalent result type.
 */
export default async function promiseAsResult<T>(
    promise: Promise<T>
): Promise<Result<T>> {
    try {
        return {
            success: true,
            value: await promise
        }
    } catch (error: any) {
        return {
            success: false,
            error
        }
    }
}
