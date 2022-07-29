import {DatasetItem} from "./DatasetItem";

/** Represents all items in a dataset. */
export type Dataset<I extends DatasetItem<unknown, unknown>>
    = ReadonlyMap<string, I>
