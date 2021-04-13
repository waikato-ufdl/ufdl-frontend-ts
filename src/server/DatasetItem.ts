import {FileCache} from "./FileCacheContext";

export type DatasetItem<A> = {
    readonly dataHandle: string
    readonly dataCache: FileCache
    readonly resident: boolean
    readonly selected: boolean
    readonly annotations?: A
}
