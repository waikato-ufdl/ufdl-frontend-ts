export function toBlob(arr: Uint8Array | ArrayBufferLike): Blob {
    if (arr instanceof Uint8Array) arr = arr.buffer;
    return new Blob([arr]);
}

