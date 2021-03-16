import {sum} from "./math";

export function concatUint8Array(...arrs: Uint8Array[]): Uint8Array {

    if (arrs.length === 0) return new Uint8Array();

    const ret = new Uint8Array(sum(...arrs.map((value) => { return value.length })));

    let offset = 0;

    for (const arr of arrs) {
        ret.set(arr, offset);
        offset += arr.length;
    }

    return ret;
}