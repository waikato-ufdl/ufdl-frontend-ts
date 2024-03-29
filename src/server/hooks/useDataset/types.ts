import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {Loading} from "../../Loading";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {Data} from "../../types/data";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {OptionalAnnotations} from "../../types/annotations/OptionalAnnotations";
import {DatasetPK} from "../../pk";
import {UseMutateFunction, UseMutationOptions, UseQueryResult} from "@tanstack/react-query";
import {TOGGLE} from "./selection";
import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import {
    DatasetDispatchItem,
    MutableDatasetDispatch,
    MutableDatasetDispatchItem
} from "./DatasetDispatch";
import {ReadonlyQueryResult} from "../../../util/react/query/types";
import {DatasetMutationMethods} from "./useDatasetMutationMethods";
import {Task, TaskResult} from "../../../util/typescript/task/Task";


/**
 * The type of function that gets the data for a file in a dataset.
 */
export type DataGetterFunction<D extends Data> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    rawData: BlobSubject
) => Loading<D> | Promise<Loading<D>>

/**
 * The type of function that sets the data for a file in a dataset.
 */
export type DataSetterFunction<D extends Data> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    data: D
) => Promise<void> | void

/**
 * The type of function that gets the annotations for a file in a dataset.
 */
export type AnnotationsGetterFunction<A> = (
    context: UFDLServerContext,
    dataset: DatasetInstance
) => Task<{[filename: string]: A | typeof NO_ANNOTATION | undefined}, string, never, never>

/**
 * The type of function that sets the annotations for a file in a dataset.
 */
export type AnnotationsSetterFunction<A> = (
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: A | typeof NO_ANNOTATION }
) => Task<unknown, string, never, never>

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
> = new (
        serverContext: UFDLServerContext,
        pk: DatasetPK,
        fileOrdering: string[],
        datasetResult: UseQueryResult<DatasetInstance>,
        itemMap: ReadonlyMap<string, I>,
        mutationMethods: DatasetMutationMethods<D, A>
    ) => DIS

export type MutableDatasetDispatchItemConstructor<D extends Data, A, I extends MutableDatasetDispatchItem<D, A> = MutableDatasetDispatchItem<D, A>>
    = new(
        filename: string,
        handle: string,
        data: DatasetDispatchItemDataType<D>,
        annotations: DatasetDispatchItemAnnotationType<A>,
        selected: boolean,
        setSelected: React.Dispatch<[string, boolean | typeof TOGGLE]>,
        setAnnotationsMutation: UseMutateFunctionWithTask<
            Task<unknown, string, never, never>,
            unknown,
            ReadonlyMap<string, OptionalAnnotations<A>>
        >
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
    = ReadonlyQueryResult<Loading<D>>

export type DatasetDispatchItemAnnotationType<A>
    = ReadonlyQueryResult<OptionalAnnotations<A>>

export type DatasetDispatchItemType<D extends Data, A>
    = DatasetItem<
    DatasetDispatchItemDataType<D>,
    DatasetDispatchItemAnnotationType<A>
>

export type UseMutationOptionsWithCallbacks<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> =
    UseMutationOptions<TData, TError, [TVariables, ((result: TData) => void)?, ((reason: any) => void)?], TContext>

export type UseMutateFunctionWithCallbacks<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> =
    UseMutateFunction<TData, TError, [TVariables, ((result: TData) => void)?, ((reason: any) => void)?], TContext>

export type UseMutationOptionsWithTask<TTask extends Task<unknown, unknown, unknown, never>, TError = unknown, TVariables = void, TContext = unknown> =
    UseMutationOptions<TaskResult<TTask>, TError, [TVariables, (task: TTask) => void], TContext>

export type UseMutateFunctionWithTask<TTask extends Task<unknown, unknown, unknown, never>, TError = unknown, TVariables = void, TContext = unknown> =
    UseMutateFunction<TaskResult<TTask>, TError, [TVariables, (task: TTask) => void], TContext>