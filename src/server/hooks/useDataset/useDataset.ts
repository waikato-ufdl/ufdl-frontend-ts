import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as DatasetCore from "ufdl-ts-client/functional/core/dataset"
import {DatasetPK} from "../../pk";
import {mapOwnProperties} from "../../../util/typescript/object";
import forDownload from "../../forDownload";
import {mapMap, mapToObject} from "../../../util/map";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {
    QueryClient,
    QueryObserverResult,
    UseMutateFunction,
    useMutation,
    UseMutationOptions,
    useQueries,
    useQuery,
    useQueryClient,
    UseQueryOptions
} from "react-query";
import {QueryFunctionContext} from "react-query/types/core/types";
import compressFiles from "../../util/compressFiles";
import useDerivedReducer from "../../../util/react/hooks/useDerivedReducer";
import {
    AnnotationsGetterFunction,
    AnnotationsSetterFunction,
    DataGetterFunction,
    MutableDatasetDispatchConstructor,
    DataSetterFunction, MutableDatasetDispatchItemConstructor
} from "./types";
import assert from "assert";
import {Data} from "../../types/data";
import iterate from "../../../util/typescript/iterate/iterate";
import iteratorMap from "../../../util/typescript/iterate/map";
import {selectedInitialiser, selectedReducer, TOGGLE} from "./selection";
import isPromise from "../../../util/typescript/async/isPromise";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {NO_ANNOTATION, OptionalAnnotations} from "../../types/annotations";
import {NamedFileInstance} from "ufdl-ts-client/types/core/named_file";
import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "./DatasetDispatch";
import {InTransit} from "../../InTransit";
import ifDefined from "../../../util/typescript/ifDefined";
import useDerivedStates from "../../../util/react/hooks/useDerivedStates";
import zip from "../../../util/typescript/iterate/zip";
import {toReadonlyQueryResult} from "../../../util/react/query/util";
import mapQueryResult from "../../../util/react/query/mapQueryResult";
import repeat from "../../../util/typescript/iterate/repeat";
import {tuple} from "../../../util/typescript/arrays/tuple";
import useDatasetMutationMethods from "./useDatasetMutationMethods";
import {useEffect} from "react";


/**
 * Baseline functionality for using a dataset on the server. Extended via the
 * parameters for domain-specific functionality.
 *
 * @param serverContext
 *          The server context to use for accessing the dataset on the server.
 * @param getData
 *          Function for getting the data for a particular file from the server.
 * @param setData
 *          Function for setting the data for a particular file on the server.
 * @param getAnnotations
 *          Function for getting the annotations for a particular file from the server.
 * @param setAnnotations
 *          Function for setting the annotations for a particular file on the server.
 * @param itemConstructor
 *          Function for creating items.
 * @param dispatchConstructor
 *          The dataset dispatch constructor for the relevant domain.
 * @param datasetPK
 *          The PK of the dataset to use.
 */
export default function useDataset<
    D extends Data,
    A,
    I extends MutableDatasetDispatchItem<D, A>,
    DIS extends MutableDatasetDispatch<D, A, I>
>(
    serverContext: UFDLServerContext,
    getData: DataGetterFunction<D>,
    setData: DataSetterFunction<D>,
    getAnnotations: AnnotationsGetterFunction<A>,
    setAnnotations: AnnotationsSetterFunction<A>,
    itemConstructor: MutableDatasetDispatchItemConstructor<D, A, I>,
    dispatchConstructor: MutableDatasetDispatchConstructor<D, A, I, DIS>,
    datasetPK?: DatasetPK,
    queryDependencies?: readonly unknown[]
): DIS | undefined {

    // Get the React-Query client instance
    const queryClient = useQueryClient()

    // Create a query for getting the dataset meta-data
    const datasetQuery: UseQueryOptions<DatasetInstance | undefined, unknown, DatasetInstance, ["dataset", DatasetPK | undefined]> = useDerivedState(
        ([serverContext, datasetPK]) => {
            return {
                queryKey: datasetQueryKey(datasetPK),
                queryFn(context) {
                    const pk = context.queryKey[1];
                    if (pk === undefined) return undefined;
                    return DatasetCore.retrieve(
                        serverContext,
                        pk.asNumber
                    )
                },
                staleTime: Infinity
            }
        },
        [serverContext, datasetPK] as const
    )
    const datasetResult = useQuery(datasetQuery)

    // Create a constant ordering of the files in the dataset
    const filenameMap = useDerivedStates<readonly [string, string], readonly [string, string]>(
        tuple,
        ifDefined(
            datasetResult.data?.files,
            files => mapOwnProperties(files, (file, handle) => [file as string, handle] as const),
            () => []
        )
    )

    const fileOrdering = useDerivedState(
        ([filenameMap]) => new Map(filenameMap.keys()),
        [filenameMap] as const
    )

    // Create queries for each of the files in the dataset
    const fileDataQueries = useDerivedState(
        ([files, serverContext, dataset, getData, datasetPK, queryClient]) => {
            return [...files.keys()].map(
                (filename) => {
                    // `files` will be empty if dataset is undefined, so this function won't be called
                    assert(dataset !== undefined)

                    return {
                        queryKey: fileQueryKey(datasetPK, filename as string),
                        async queryFn(context: QueryFunctionContext<ReturnType<typeof fileQueryKey>>) {
                            // Get the PK of the dataset from the query-key
                            const pk = context.queryKey[1];

                            // If the PK is undefined, this function should not be called
                            if (pk === undefined) throw new Error("No dataset PK");

                            // Get the filename from the query-key
                            const filename = context.queryKey[3] as string;

                            // Begin the download of the file data
                            const download = forDownload(DatasetCore.get_file)(
                                serverContext,
                                pk.asNumber,
                                filename
                            )

                            const data = getData(
                                serverContext,
                                dataset,
                                filename,
                                download
                            )

                            const resolvedData = isPromise(data)
                                ? await data
                                : data

                            return [filename, resolvedData] as const
                        },
                        onError() {
                            queryClient.invalidateQueries(datasetQueryKey(datasetPK))
                        },
                        staleTime: Infinity,
                        enabled: false
                    }
                }
            )
        },
        [fileOrdering, serverContext, datasetResult.data, getData, datasetPK, queryClient] as const
    )
    const fileDataResults = useQueries(fileDataQueries)

    // Create queries for the annotations for each of the files in the dataset
    const fileAnnotationQueries = useDerivedState(
        ([files, serverContext, dataset, getAnnotations, queryClient]) => {
            return [...files.keys()].map(
                (filename) => {
                    // `files` will be empty if dataset is undefined, so this function won't be called
                    assert(dataset !== undefined)

                    return {
                        queryKey: annotationsQueryKey(datasetPK, filename as string),
                        async queryFn(context: QueryFunctionContext<ReturnType<typeof annotationsQueryKey>>) {
                            const pk = context.queryKey[1];
                            if (pk === undefined) throw new Error("PK was undefined");
                            const filename = context.queryKey[3] as string;
                            const annotations = await getAnnotations(serverContext, dataset, filename);
                            return [filename, annotations] as const
                        },
                        onError() {
                            queryClient.invalidateQueries(datasetQueryKey(datasetPK))
                        },
                        staleTime: Infinity,
                        enabled: false
                    }
                }
            )
        },
        [fileOrdering, serverContext, datasetResult.data, getAnnotations, queryClient] as const
    )
    const fileAnnotationResults = useQueries(fileAnnotationQueries)

    useEffect(
        () => {
            if (queryDependencies === undefined) return
            function refetch(result: QueryObserverResult) {
                result.refetch({ cancelRefetch: false })
            }
            refetch(datasetResult)
            fileDataResults.forEach(refetch)
            fileAnnotationResults.forEach(refetch)
        },
        queryDependencies ?? []
    )

    // Create a mutation for adding new files to the dataset
    const addFilesMutationOptions: UseMutationOptions<NamedFileInstance[], unknown, ReadonlyMap<string, D>>
        = useDerivedState(
            ([serverContext, datasetPK, setData, dataset, queryClient]) => {
                return {
                    async mutationFn(files) {
                        // Can't add to an undefined dataset
                        if (datasetPK === undefined || dataset === undefined) throw new Error("Dataset undefined")

                        // Extract the raw data
                        const rawData = mapMap(
                            files,
                            (filename, data) => [[filename, data.raw]] as const
                        )

                        // Compress the file data for bulk upload
                        const compressed = await compressFiles(rawData);

                        // Upload the files, or pass if compression failed
                        // (need to await in case setData relies on the files being resident
                        // on the server)
                        const addedFiles = await DatasetCore.add_files(
                            serverContext,
                            datasetPK.asNumber,
                            compressed
                        )

                        await Promise.all(
                            iteratorMap(
                                iterate(files),
                                ([filename, data]) => {
                                    setData(
                                        serverContext,
                                        dataset,
                                        filename,
                                        data
                                    )
                                }
                            )
                        )

                        return addedFiles
                    },
                    async onMutate(files) {
                        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
                        await cancelOutgoingQueries(queryClient, datasetPK)

                        // Snapshot the previous values
                        const currentState = getCurrentState<D, A>(queryClient, datasetPK)
                        const [previousDatasetJSON] = currentState

                        // Create the updated values
                        const updatedDatasetJSON = {
                            ...previousDatasetJSON,
                            files: {
                                ...previousDatasetJSON.files,
                                ...mapToObject(
                                    mapMap(
                                        files,
                                        (filename) => [[filename, "UNKNOWN HANDLE"]]
                                    )
                                )
                            }
                        }

                        // Optimistically update to the new value
                        files.forEach(
                            (fileData, filename) => {
                                queryClient.setQueryData(
                                    fileQueryKey(datasetPK, filename),
                                    [filename, InTransit.fromPlain(fileData)] as const
                                )
                                queryClient.setQueryData(
                                    annotationsQueryKey(datasetPK, filename),
                                    [filename, NO_ANNOTATION] as const
                                )
                            }
                        )
                        queryClient.setQueryData(
                            datasetQueryKey(datasetPK),
                            updatedDatasetJSON
                        )
                    },
                    onError() {
                        queryClient.invalidateQueries(datasetQueryKey(datasetPK), {exact: true})
                    }
                }
            },
            [serverContext, datasetPK, setData, datasetResult.data, queryClient] as const
        )
    const addFilesMutation = useMutation(addFilesMutationOptions)

    // Create a mutation for deleting files from the dataset
    const deleteFileMutationOptions: UseMutationOptions<NamedFileInstance, unknown, string>
        = useDerivedState(
            ([serverContext, datasetPK]) => {
                return {
                    async mutationFn(filename) {
                        // Can't delete from an undefined dataset
                        if (datasetPK === undefined) throw new Error("No dataset defined")

                        // Delete the file
                        return DatasetCore.delete_file(
                            serverContext,
                            datasetPK.asNumber,
                            filename
                        )
                    },
                    async onMutate(filename) {
                        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
                        await cancelOutgoingQueries(queryClient, datasetPK)

                        // Snapshot the previous values
                        const currentState = getCurrentState(queryClient, datasetPK)
                        const [previousDatasetJSON] = currentState

                        // Create the updated values
                        const updatedDatasetJSON = {
                            ...previousDatasetJSON,
                            files: {
                                ...previousDatasetJSON.files
                            }
                        }
                        delete updatedDatasetJSON.files[filename]

                        // Optimistically update to the new value
                        queryClient.removeQueries(fileQueryKey(datasetPK, filename), {exact: true})
                        queryClient.removeQueries(annotationsQueryKey(datasetPK, filename), {exact: true})
                        queryClient.setQueryData(datasetQueryKey(datasetPK), updatedDatasetJSON)

                        // Return a context object with the snapshotted value
                        return currentState
                    },
                    onError() {
                        queryClient.refetchQueries(datasetQueryKey(datasetPK), {exact: true})
                    }
                }
            },
            [serverContext, datasetPK] as const
        )
    const deleteFileMutation = useMutation(deleteFileMutationOptions)

    // Create a mutation for setting the annotations for a file in the dataset
    const setAnnotationsMutationOptions: UseMutationOptions<void, unknown, [string, OptionalAnnotations<A>]> = useDerivedState(
        ([serverContext, dataset, setAnnotations]) => {
            return {
                async mutationFn([filename, annotations]) {
                    // Can't set annotations against an undefined dataset
                    if (dataset === undefined) throw new Error("No dataset defined")

                    // Set the annotations
                    return setAnnotations(
                        serverContext,
                        dataset,
                        filename,
                        annotations
                    )
                },
                async onMutate([filename, annotations]) {
                    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
                    await cancelOutgoingQueries(queryClient, datasetPK)

                    // Optimistically update to the new value
                    queryClient.setQueryData(
                        annotationsQueryKey(datasetPK, filename),
                        [filename, annotations]
                    )
                },
                onError(_, [filename]) {
                    queryClient.invalidateQueries(datasetQueryKey(datasetPK), {exact: true})
                    queryClient.invalidateQueries(fileQueryKey(datasetPK, filename), {exact: true})
                    queryClient.invalidateQueries(annotationsQueryKey(datasetPK, filename), {exact: true})
                }
            }
        },
        [serverContext, datasetResult.data, setAnnotations] as const
    )
    const setAnnotationsMutation = useMutation(setAnnotationsMutationOptions)

    // Add some state to handle the selected-state of each dataset item (client-side only)
    const [selected, setSelected] = useDerivedReducer(
        selectedReducer,
        selectedInitialiser,
        [...fileOrdering.keys()]
    )

    const itemFactory = useDerivedState(
        ([itemConstructor]) => (
            filename: string,
            handle: string,
            fileDataResult: QueryObserverResult<readonly [string, InTransit<D>]>,
            fileAnnotationResult:  QueryObserverResult<readonly [string, OptionalAnnotations<A>]>,
            selected: boolean,
            setSelected: React.Dispatch<[string, (boolean | typeof TOGGLE)]>,
            setAnnotationsMutation: UseMutateFunction<void, unknown, [string, OptionalAnnotations<A>]>
        ) => {
            return new itemConstructor(
                filename,
                handle,
                toReadonlyQueryResult(mapQueryResult(fileDataResult, value => value[1])),
                toReadonlyQueryResult(mapQueryResult(fileAnnotationResult, value => value[1])),
                selected,
                setSelected,
                setAnnotationsMutation
            )
        },
        [itemConstructor] as const
    )

    const itemMultiMap = useDerivedStates(
        itemFactory,
        [...zip(
            fileOrdering.keys(),
            fileOrdering.values(),
            iterate(fileDataResults),
            iterate(fileAnnotationResults),
            selected.values(),
            repeat(setSelected),
            repeat(setAnnotationsMutation.mutate)
        )] as const
    )

    const itemMap = useDerivedState(
        ([itemMultiMap, fileOrdering]) => {
            const unordered = new Map(iteratorMap(itemMultiMap.values(), value => [value.filename, value]))
            const ordered = new Map<string, I>()
            for (const filename of fileOrdering.keys()) {
                ordered.set(filename, unordered.get(filename)!)
            }
            return ordered
        },
        [itemMultiMap, fileOrdering] as const
    )

    const fileOrderingArray = useDerivedState(
        ([fileOrdering]) => [...fileOrdering.keys()],
        [fileOrdering] as const
    )

    const mutationMethods = useDatasetMutationMethods(
        itemMap,
        fileOrderingArray,
        addFilesMutation.mutate,
        deleteFileMutation.mutate,
        setAnnotationsMutation.mutate,
        setSelected
    )

    // Derive the dispatch state from the arguments which construct it and return it
    const dispatch = useDerivedState(
        ([dispatchConstructor, serverContext, datasetPK, fileOrdering, datasetResult, itemMap, ...mutations]) => {
            if (datasetPK === undefined) return undefined
            return new dispatchConstructor(
                    serverContext,
                    datasetPK,
                    fileOrdering,
                    datasetResult,
                    itemMap,
                    ...mutations
                )
        },
        [
            dispatchConstructor,
            serverContext,
            datasetPK,
            fileOrderingArray,
            datasetResult,
            itemMap,
            ...mutationMethods
        ] as const
    );

    return dispatch
}

/**
 * Creates the query-key for a dataset.
 *
 * @param datasetPK
 *          The dataset.
 * @return
 *          The query-key.
 */
function datasetQueryKey(
    datasetPK: DatasetPK | undefined
): ["dataset", DatasetPK | undefined] {
    return ["dataset", datasetPK]
}

function fileQueryKey(
    datasetPK: DatasetPK | undefined,
    handle: string
): ["dataset", DatasetPK | undefined, "file", string] {
    return ["dataset", datasetPK, "file", handle]
}

function annotationsQueryKey(
    datasetPK: DatasetPK | undefined,
    filename: string
): ["dataset", DatasetPK | undefined, "annotations", string] {
    return ["dataset", datasetPK, "annotations", filename]
}

/**
 * Cancels all out-going queries for the dataset.
 *
 * @param queryClient
 *          The query-client.
 * @param datasetPK
 *          The dataset.
 */
async function cancelOutgoingQueries(
    queryClient: QueryClient,
    datasetPK: DatasetPK | undefined
): Promise<void> {
    await queryClient.cancelQueries(datasetQueryKey(datasetPK))
    await queryClient.cancelQueries(["dataset", datasetPK, "files"])
    await queryClient.cancelQueries(["dataset", datasetPK, "annotations"])
}

type DatasetState<D extends Data, A> = [DatasetInstance, [string, InTransit<D>][], [string, OptionalAnnotations<A>][]]

function getCurrentState<D extends Data, A>(
    queryClient: QueryClient,
    datasetPK: DatasetPK | undefined
): DatasetState<D, A> {
    const previousDatasetJSON = queryClient.getQueryData(datasetQueryKey(datasetPK), {exact: true}) as DatasetInstance

    const previousFiles = queryClient
        .getQueriesData(["dataset", datasetPK, "files"])
        .map(
            ([_, value]) => value as [string, InTransit<D>]
        )

    const previousAnnotations = queryClient
        .getQueriesData(["dataset", datasetPK, "annotations"])
        .map(
            ([_, value]) => value as [string, OptionalAnnotations<A>]
        )

    return [previousDatasetJSON, previousFiles, previousAnnotations]
}
