/**
 * Converts a Uint8Array into a Blob.
 *
 * @param array
 *          The array to convert.
 * @return
 *          The blob.
 */
export function toBlob(
    array: Uint8Array | ArrayBuffer
): Blob {
    if (array instanceof Uint8Array) array = array.buffer;
    return new Blob([array]);
}
