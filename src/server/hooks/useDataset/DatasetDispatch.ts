import iteratorMap from "../../../util/typescript/iterate/map";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../pk";
import {iteratorReduce} from "../../../util/typescript/iterate/reduce";
import {TOGGLE} from "./selection";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {QueryObserverResult, RefetchOptions, RefetchQueryFilters, UseMutationResult, UseQueryResult} from "react-query";
import {NamedFileInstance} from "ufdl-ts-client/types/core/named_file";
import {ReadonlyQueryResult} from "../../../util/react/query/types";
import iterate from "../../../util/typescript/iterate/iterate";
import {Dataset} from "../../types/Dataset";
import {Data} from "../../types/data";
import {OptionalAnnotations} from "../../types/annotations";
import iteratorFilter from "../../../util/typescript/iterate/filter";
import {SelfIterableIterator} from "../../../util/typescript/iterate/SelfIterableIterator";
import {
    DatasetDispatchItemAnnotationType,
    DatasetDispatchItemDataType, DatasetDispatchItemSelector,
    DatasetDispatchItemType
} from "./types";


export class DatasetDispatchItem<D extends Data, A>
    implements DatasetDispatchItemType<D, A>
{
    constructor(
        readonly filename: string,
        readonly handle: string,
        readonly data: DatasetDispatchItemDataType<D>,
        readonly annotations: DatasetDispatchItemAnnotationType<A>,
        readonly selected: boolean
    ) {}
}

export class MutableDatasetDispatchItem<D extends Data, A>
    extends DatasetDispatchItem<D, A> {

    constructor(
        filename: string,
        handle: string,
        data: DatasetDispatchItemDataType<D>,
        annotations: DatasetDispatchItemAnnotationType<A>,
        selected: boolean,
        private readonly _setSelected: React.Dispatch<[string, boolean | typeof TOGGLE]>,
        private readonly _setAnnotationsMutation: UseMutationResult<void, unknown, [string, OptionalAnnotations<A>]>
    ) {
        super(
            filename,
            handle,
            data,
            annotations,
            selected
        )
    }

    setSelected(value: boolean | typeof TOGGLE) {
        this._setSelected([this.filename, value])
    }

    setAnnotations(annotations: OptionalAnnotations<A>) {
        this._setAnnotationsMutation.mutate([this.filename, annotations])
    }

}

/**
 * Type of object which abstracts dispatch to react-query for datasets.
 */
export class DatasetDispatch<D extends Data, A, I extends DatasetDispatchItem<D, A> = DatasetDispatchItem<D, A>>
    implements Dataset<I>,
    ReadonlyQueryResult<DatasetInstance>
{
    constructor(
        protected readonly serverContext: UFDLServerContext,
        readonly pk: DatasetPK,
        protected readonly fileOrdering: string[],
        protected readonly datasetResult: UseQueryResult<DatasetInstance>,
        protected readonly itemMap: ReadonlyMap<string, I>
    ) {
    }

    get numSelected(): number {
        return iteratorReduce(
            this.itemMap.values(),
            (acc, value) => value.selected ? acc + 1 : acc,
            0
        )
    }

    iterateSelected(): SelfIterableIterator<string> {
        return iteratorMap(
            iteratorFilter(
                this.entries(),
                ([_filename, item]) => item.selected
            ),
            ([filename]) => filename
        )
    }

    [Symbol.iterator](): IterableIterator<[string, I]> {
        return iterate(this.itemMap)
    }

    entries(): IterableIterator<[string, I]> {
        return iterate(this);
    }

    get(key: string): I | undefined {
        return this.itemMap.get(key);
    }

    has(key: string): boolean {
        return this.itemMap.has(key);
    }

    keys(): IterableIterator<string> {
        return iterate(this.fileOrdering);
    }

    get size(): number { return this.itemMap.size }

    values(): IterableIterator<I> {
        return this.itemMap.values();
    }

    get data(): DatasetInstance | undefined { return this.datasetResult.data }
    get error(): unknown { return this.datasetResult.error }
    get isError(): boolean { return this.datasetResult.isError }
    get isIdle(): boolean { return this.datasetResult.isIdle }
    get isLoading(): boolean { return this.datasetResult.isLoading }
    get isLoadingError(): boolean { return this.datasetResult.isLoadingError }
    get isRefetchError(): boolean { return this.datasetResult.isRefetchError }
    get isSuccess(): boolean { return this.datasetResult.isSuccess }
    get status(): "error" | "idle" | "loading" | "success" { return this.datasetResult.status }
    refetch<TPageData>(options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined): Promise<QueryObserverResult<DatasetInstance>> {
        return this.datasetResult.refetch(options)
    }
    get dataUpdatedAt(): number { return this.datasetResult.dataUpdatedAt }
    get errorUpdateCount(): number { return this.datasetResult.errorUpdateCount }
    get errorUpdatedAt(): number { return this.datasetResult.errorUpdatedAt }
    get failureCount(): number { return this.datasetResult.failureCount }
    get isFetched(): boolean { return this.datasetResult.isFetched }
    get isFetchedAfterMount(): boolean { return this.datasetResult.isFetchedAfterMount }
    get isFetching(): boolean { return this.datasetResult.isFetching }
    get isPlaceholderData(): boolean { return this.datasetResult.isPlaceholderData }
    get isPreviousData(): boolean { return this.datasetResult.isPreviousData }
    get isRefetching(): boolean { return this.datasetResult.isRefetching }
    get isStale(): boolean { return this.datasetResult.isStale }

    forEach(
        callbackfn: (
            value: I,
            key: string,
            map: ReadonlyMap<string, I>
        ) => void,
        thisArg?: any
    ): void {
        if (thisArg !== undefined) callbackfn = callbackfn.bind(thisArg)
        for (const [key, value] of this.entries()) {
            callbackfn(value, key, this)
        }
    }
}

export class MutableDatasetDispatch<D extends Data, A, I extends MutableDatasetDispatchItem<D, A> = MutableDatasetDispatchItem<D, A>>
    extends DatasetDispatch<D, A, I> {

    constructor(
        serverContext: UFDLServerContext,
        pk: DatasetPK,
        fileOrdering: string[],
        datasetResult: UseQueryResult<DatasetInstance>,
        private readonly addFilesMutation: UseMutationResult<NamedFileInstance[], unknown, ReadonlyMap<string, D>>,
        private readonly deleteFileMutation: UseMutationResult<NamedFileInstance, unknown, string>,
        private readonly setAnnotationsMutation: UseMutationResult<void, unknown, [string, OptionalAnnotations<A>]>,
        private readonly setSelected: React.Dispatch<[string, boolean | typeof TOGGLE]>,
        itemMap: ReadonlyMap<string, I>
    ) {
        super(
            serverContext,
            pk,
            fileOrdering,
            datasetResult,
            itemMap
        )
    }

    select(itemSelection: DatasetDispatchItemSelector<D, A>): void {
        for (const filename of this.fileOrdering) {
            if (itemSelection(this.itemMap.get(filename)!, filename, this)) {
                this.setSelected([filename, true])
            }
        }
    }

    deselect(itemSelection: DatasetDispatchItemSelector<D, A>): void {
        for (const filename of this.fileOrdering) {
            if (itemSelection(this.itemMap.get(filename)!, filename, this)) {
                this.setSelected([filename, false])
            }
        }
    }

    toggleSelection(
        itemSelection: DatasetDispatchItemSelector<D, A>
    ) {
        for (const filename of this.fileOrdering) {
            if (itemSelection(this.itemMap.get(filename)!, filename, this)) {
                this.setSelected([filename, TOGGLE])
            }
        }
    }

    selectOnly(
        itemSelection: DatasetDispatchItemSelector<D, A>
    ) {
        for (const filename of this.fileOrdering) {
            if (itemSelection(this.itemMap.get(filename)!, filename, this)) {
                this.setSelected([filename, true])
            } else {
                this.setSelected([filename, false])
            }
        }
    }

    deleteSelectedFiles(): void {
        for (const filename of this.fileOrdering) {
            if (this.get(filename)!.selected) {
                this.delete(filename)
            }
        }
    }

    setAnnotationsForSelected(annotations: OptionalAnnotations<A>): void {
        for (const filename of this.fileOrdering) {
            if (this.get(filename)!.selected) {
                this.setAnnotationsForFile(filename, annotations)
            }
        }
    }

    setAnnotationsForFile(filename: string, annotations: OptionalAnnotations<A>): void {
        this.setAnnotationsMutation.mutate([filename, annotations])
    }

    setAnnotations(
        modifications: ReadonlyMap<string, OptionalAnnotations<A>>
    ) {
        for (const [filename, annotations] of modifications) {
            this.setAnnotationsForFile(filename, annotations)
        }
    }

    clear(): void {
        for (const filename of this.fileOrdering) {
            this.delete(filename)
        }
    }

    delete(key: string): boolean {
        if (!this.has(key)) return false;
        this.deleteFileMutation.mutate(key)
        return true;
    }

    addFiles(files: ReadonlyMap<string, D>) {
        this.addFilesMutation.mutate(files)
    }
}
