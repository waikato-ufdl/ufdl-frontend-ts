import {BehaviorSubject} from "rxjs";

export type DatasetItem<A> = {
    readonly data: BehaviorSubject<Blob>
    readonly resident: boolean
    readonly selected: boolean
    readonly annotations?: A
}
