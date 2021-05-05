import {DatasetItem} from "./DatasetItem";

/** Represents all items in a dataset. */
export type Dataset<D, A> = ReadonlyMap<string, DatasetItem<D, A>>
