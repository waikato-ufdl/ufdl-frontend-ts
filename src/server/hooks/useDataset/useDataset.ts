import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../pk";
import {DataCache} from "../../DataCache";
import React, {useContext, useEffect, useReducer} from "react";
import useTaskWatcher from "../../../util/react/hooks/useTaskWatcher";
import {DATASET_REDUCER, DatasetReducer, DatasetReducerAction} from "./DatasetReducer";
import * as DatasetCore from "ufdl-ts-client/functional/core/dataset";
import forEachOwnProperty from "../../../util/typescript/forEachOwnProperty";
import forDownload from "../../forDownload";
import {mapGetDefault} from "../../../util/map";
import AddItem from "./actions/AddItem";
import UpdateItem from "./actions/UpdateItem";
import promiseAsResult from "../../../util/typescript/async/promiseAsResult";
import Clear from "./actions/Clear";
import {result} from "../../../util/typescript/result";
import {DatasetDispatchConstructor} from "./DatasetDispatch";
import useDerivedState from "../../../util/react/hooks/useDerivedState";

export type GetAnnotationsFunction<A> = (
    context: UFDLServerContext,
    pk: number
) => (filename: string) => Promise<A>

export default function useDataset<
    D,
    A,
    DRA extends DatasetReducerAction<any, D, A>,
    DISC extends DatasetDispatchConstructor<D, A, DRA, any>
>(
    serverContext: UFDLServerContext,
    dataCacheContext: React.Context<DataCache<D>>,
    getAnnotations: GetAnnotationsFunction<A>,
    initialAnnotations: A,
    dispatchConstructor: DISC,
    datasetPK?: DatasetPK
): InstanceType<DISC> | undefined {

    const dataCache = useContext(dataCacheContext);

    const [synchronised, addTask] = useTaskWatcher();

    const [reducerState, dispatch] = useReducer<DatasetReducer<D, A, DRA>, null>(
        DATASET_REDUCER,
        null,
        () => new Map()
    );

    useEffect(
        () => {
            dispatch(new Clear())
            if (datasetPK !== undefined) {
                addTask(
                    loadDatasetInit(serverContext, datasetPK, dataCache, dispatch, getAnnotations, initialAnnotations),
                    true
                );
            }
        },
        [serverContext.host, serverContext.username, datasetPK, addTask, dataCache]
    );

    return useDerivedState(
        () => datasetPK === undefined
            ? undefined
            : new dispatchConstructor(
                reducerState,
                synchronised,
                datasetPK,
                dispatch,
                serverContext,
                addTask,
                dataCache
            ),
        [
            reducerState,
            synchronised,
            datasetPK,
            dispatch,
            serverContext,
            addTask,
            dataCache
        ]
    );
}

async function loadDatasetInit<D, A>(
    context: UFDLServerContext,
    pk: DatasetPK,
    dataCache: DataCache<D>,
    dispatch: (action: AddItem<D, A> | UpdateItem<D, A>) => void,
    getAnnotations: GetAnnotationsFunction<A>,
    initialAnnotations: A
): Promise<void> {
    // Get the dataset meta-data from the server
    const dataset = await DatasetCore.retrieve(context, pk.asNumber);

    // Begin loading the annotations from the server
    const annotations = getAnnotations(context, pk.asNumber);

    const annotationPromises: Promise<void>[] = [];

    // Add an item for each file
    forEachOwnProperty(
        dataset.files,
        (filename, handle) => {
            // Trigger the caching of the file-data
            mapGetDefault(
                dataCache,
                handle,
                () => forDownload(DatasetCore.get_file)(
                    context,
                    pk.asNumber,
                    filename as string
                ),
                true
            );

            // Dispatch the item to the dataset hook
            dispatch(
                new AddItem<D, A>(
                    {
                        filename: filename as string,
                        dataHandle: handle,
                        dataCache: dataCache,
                        dataResident: result(true, undefined),
                        annotations: initialAnnotations,
                        annotationsResident: result(false, "in progress"),
                        selected: false
                    }
                )
            )

            annotationPromises.push(
                promiseAsResult(annotations(filename as string)).then(
                    (result) => {
                        dispatch(
                            new UpdateItem(
                                result.success
                                    ? {
                                        filename: filename as string,
                                        annotations: result.value
                                    }
                                    : {
                                        filename: filename as string,
                                        annotationsResident: result
                                    }
                            )
                        )
                    }
                )
            )
        }
    );

    await Promise.all(annotationPromises);
}