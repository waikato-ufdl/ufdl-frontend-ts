import {tryMap} from "../error/tryMap";

export default async function mapPromise<T, R>(
    promise: Promise<T>,
    mapResult: (result: T) => R,
    mapError?: (error: any) => any
): Promise<R> {
    let result: T
    try {
        result = await promise
    } catch (error) {
        if (mapError === undefined) throw error

        throw tryMap(error, mapError, "mapError")
    }

    return tryMap(result, mapResult, "mapResult")
}