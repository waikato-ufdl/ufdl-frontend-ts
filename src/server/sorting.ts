import {CompareFunction} from "../util/typescript/sort/CompareFunction";
import {DatasetItem} from "./types/DatasetItem";
import {createHash} from "crypto";

export const BY_FILENAME: CompareFunction<DatasetItem<unknown, unknown>> = (
    a,
    b
) => {
    return a.filename.localeCompare(b.filename)
}

export const BY_HASH: CompareFunction<DatasetItem<unknown, unknown>> = (
    a,
    b
) => {
    const hashA = createHash("sha1").update(a.filename).digest().toString("base64")
    const hashB = createHash("sha1").update(b.filename).digest().toString("base64")
    return hashA.localeCompare(hashB)
}