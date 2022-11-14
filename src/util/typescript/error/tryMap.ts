export class MappingError extends Error {
    constructor(
        mapFunctionName: string,
        public readonly value: any,
        error: unknown
    ) {
        super(`${mapFunctionName} threw`, { cause: error });
    }
}

export function tryMap<T, R>(
    value: T,
    mapFunction: (value: T) => R,
    mapFunctionName: string = "mapFunction"
): R {
    try {
        return mapFunction(value)
    } catch (mappingError) {
        throw new MappingError(mapFunctionName, value, mappingError)
    }
}
