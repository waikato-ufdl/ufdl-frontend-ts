import {DataCache} from "../DataCache";
import {PartialResult} from "../../util/typescript/result";

export type DataCacheEntry<D> = {
    readonly handle: string
    readonly cache: DataCache<D>
}

export type DataPartialResult<D> = DataCacheEntry<D> | readonly [DataCache<D>, Blob]

/** Represents a single item in a dataset, with data of type D and annotations of type A. */
export type DatasetItem<D, A> = Readonly<{
    filename: string

    data: PartialResult<DataCacheEntry<D>, DataPartialResult<D>>

    annotations: PartialResult<A>

    selected: boolean
}>
