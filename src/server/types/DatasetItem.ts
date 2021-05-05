/** Represents a single item in a dataset, with data of type D and annotations of type A. */
import {DataCache} from "../DataCache";
import {Result} from "../../util/typescript/result";


export type DatasetItem<D, A> = Readonly<{

    filename: string

    dataHandle: string
    dataCache: DataCache<D>
    dataResident: Result<void>

    annotations: A
    annotationsResident: Result<void>

    selected: boolean
}>
