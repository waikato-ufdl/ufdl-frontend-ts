import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {InTransit} from "../../InTransit";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {Data} from "../../types/data";
import {NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import {DatasetPK} from "../../pk";
import {UseMutationResult, UseQueryResult} from "react-query";
import {NamedFileInstance} from "../../../../../ufdl-ts-client/dist/types/core/named_file";
import {TOGGLE} from "./selection";
import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import {
    DatasetDispatchItem,
    MutableDatasetDispatch,
    MutableDatasetDispatchItem
} from "./DatasetDispatch";
import {ReadonlyQueryResult} from "../../../util/react/query/types";


/**
 * The type of function that gets the data for a file in a dataset.
 */
export type DataGetterFunction<D extends Data> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    rawData: BlobSubject
) => InTransit<D> | Promise<InTransit<D>>

/**
 * The type of function that sets the data for a file in a dataset.
 */
export type DataSetterFunction<D extends Data> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    data: D
) => Promise<void>

/**
 * The type of function that gets the annotations for a file in a dataset.
 */
export type AnnotationsGetterFunction<A> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string
) => Promise<A | typeof NO_ANNOTATION>

/**
 * The type of function that sets the annotations for a file in a dataset.
 */
export type AnnotationsSetterFunction<A> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    annotations: A | typeof NO_ANNOTATION
) => Promise<void>

/**
 * Function which determines whether or not to select a given dataset item.
 */
export type ItemSelector<
    TData,
    TAnnotations,
    TItem extends DatasetItem<TData, TAnnotations> = DatasetItem<TData, TAnnotations>,
    TDataset extends Dataset<TItem> = Dataset<TItem>
> = (
    item: TItem,
    filename: string,
    dataset: TDataset
) => boolean

export type DatasetItemDataType<I extends DatasetItem<unknown, unknown>>
    = I extends DatasetItem<infer TData, unknown>
        ? TData
        : never

export type DatasetItemAnnotationType<I extends DatasetItem<unknown, unknown>>
    = I extends DatasetItem<unknown, infer TAnnotation>
        ? TAnnotation
        : never

/**
 * Required constructor semantics for dataset-dispatches.
 */
export type MutableDatasetDispatchConstructor<
    D extends Data,
    A,
    I extends MutableDatasetDispatchItem<D, A>,
    DIS extends MutableDatasetDispatch<D, A, I>
> = {
    new(
        serverContext: UFDLServerContext,
        pk: DatasetPK,
        fileOrdering: string[],
        datasetResult: UseQueryResult<DatasetInstance>,
        addFilesMutation: UseMutationResult<NamedFileInstance[], unknown, ReadonlyMap<string, D>>,
        deleteFileMutation: UseMutationResult<NamedFileInstance, unknown, string>,
        setAnnotationsMutation: UseMutationResult<void, unknown, [string, OptionalAnnotations<A>]>,
        setSelected: React.Dispatch<[string, boolean | typeof TOGGLE]>,
        itemMap: ReadonlyMap<string, I>
    ): DIS
}

export type MutableDatasetDispatchItemConstructor<D extends Data, A, I extends MutableDatasetDispatchItem<D, A> = MutableDatasetDispatchItem<D, A>>
    = new (
    filename: string,
    handle: string,
    data: DatasetDispatchItemDataType<D>,
    annotations: DatasetDispatchItemAnnotationType<A>,
    selected: boolean,
    setSelected: React.Dispatch<[string, boolean | typeof TOGGLE]>,
    setAnnotationsMutation: UseMutationResult<void, unknown, [string, OptionalAnnotations<A>]>
) => I

export type DatasetDispatchItemSelector<D extends Data, A>
    = ItemSelector<
    DatasetDispatchItemDataType<D>,
    DatasetDispatchItemAnnotationType<A>,
    DatasetDispatchItem<D, A>
    >

export type DatasetDispatchItemConstructor<D extends Data, A, I extends DatasetDispatchItem<D, A> = DatasetDispatchItem<D, A>>
    = new (
    filename: string,
    handle: string,
    data: DatasetDispatchItemDataType<D>,
    annotations: DatasetDispatchItemAnnotationType<A>,
    selected: boolean
) => I


export type DatasetDispatchItemDataType<D extends Data>
    = ReadonlyQueryResult<InTransit<D>>

export type DatasetDispatchItemAnnotationType<A>
    = ReadonlyQueryResult<OptionalAnnotations<A>>

export type DatasetDispatchItemType<D extends Data, A>
    = DatasetItem<
    DatasetDispatchItemDataType<D>,
    DatasetDispatchItemAnnotationType<A>
    >