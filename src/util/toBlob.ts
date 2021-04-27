export type BlobSource = Uint8Array | ArrayBuffer

/**
 * Converts a Uint8Array into a Blob.
 *
 * @param source
 *          The source to convert.
 * @return
 *          The blob.
 */
export default function toBlob(
    source: BlobSource
): Blob {
    if (source instanceof Uint8Array) source = source.buffer;

    return new Blob([source]);
}
