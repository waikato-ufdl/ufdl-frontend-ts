import {sum} from "../../math";

/**
 * Concatenates all given arrays into one output array.
 *
 * @param arrays
 *          The source arrays to concatenate.
 * @return
 *          The concatenated output array.
 */
export function concatUint8Array(
    ...arrays: Uint8Array[]
): Uint8Array {
    // No source arrays => output array of zero length
    if (arrays.length === 0) return new Uint8Array();

    // Calculate the total length of all source arrays
    const totalLength = sum(...arrays.map(
        (value) => value.length)
    );

    // Create a destination array of the total length
    const ret = new Uint8Array(totalLength);

    // Copy the source arrays into the destination array
    let offset = 0;
    for (const arr of arrays) {
        ret.set(arr, offset);
        offset += arr.length;
    }

    return ret;
}