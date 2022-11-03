import {anyToString} from "../../strings/anyToString";

/**
 * Converts a type-checking function into a type-asserting function.
 *
 * @param checkIs
 *          The type-checking function.
 * @param typeName
 *          An optional name for the type to include in error messages.
 * @return
 *          An equivalent type-asserting function.
 */
export function assertIs<I, T extends I>(
    checkIs: (it: I) => it is T,
    typeName?: string
): (it: I) => asserts it is T {
    return it => {
        if (checkIs(it)) return

        const errorTypeString = typeName === undefined
            ? "of the expected type"
            : `a ${typeName}`

        throw new TypeError(`${anyToString(it)} was not ${errorTypeString}`)
    }
}
