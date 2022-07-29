import {Data} from "../types/data";
import {CompareFunction} from "../../util/typescript/sort/CompareFunction";
import {DatasetDispatchItem} from "../hooks/useDataset/DatasetDispatch";
import {DomainAnnotationType, DomainDataType, DomainName} from "../domains";

export type SortOrderFunction<D extends Data, A>
    = CompareFunction<DatasetDispatchItem<D, A>>

export type SortOrders<D extends Data, A> = {
    readonly [label: string]: SortOrderFunction<D, A>
}

export type DomainSortOrderFunction<D extends DomainName>
    = SortOrderFunction<DomainDataType<D>, DomainAnnotationType<D>>

export type DomainSortOrders<D extends DomainName>
    = SortOrders<DomainDataType<D>, DomainAnnotationType<D>>
