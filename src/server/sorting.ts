import {CompareFunction} from "../util/typescript/sort/CompareFunction";
import {DatasetItem} from "./types/DatasetItem";

export const BY_FILENAME: CompareFunction<DatasetItem<unknown, unknown>> = (
    a,
    b
) => {
    return a.filename.localeCompare(b.filename)
}
