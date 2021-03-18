/**
 * Checks for array equality under the given notion of element equivalency.
 *
 * @param a
 *          The first array.
 * @param b
 *          The second array.
 * @param elementEquivalency
 *          The notion of equivalency to apply to corresponding elements. Default
 *          is ===.
 */
import {Equivalency} from "../../equivalency";
import {ElementType} from "../types/array/ElementType";

export function arrayEqual<A extends readonly unknown[]>(
    a: A,
    b: A,
    elementEquivalency: Equivalency<ElementType<A>> = (a, b) => a === b
): boolean {
    // Same arrays are equal
    if (a === b) return true;

    // Arrays of differing lengths are not equal
    if (a.length !== b.length) return false;

    // Check each element for equivalency
    for (let i = 0; i < a.length; i++) {
        if (!elementEquivalency(a[i], b[i])) return false;
    }

    // All elements are equivalent
    return true;
}