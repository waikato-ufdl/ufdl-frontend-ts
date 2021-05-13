import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../pk";
import {DataCache} from "../../DataCache";
import React, {Reducer, useContext, useEffect, useReducer} from "react";
import useTaskWatcher from "../../../util/react/hooks/useTaskWatcher";
import * as DatasetCore from "ufdl-ts-client/functional/core/dataset";
import forEachOwnProperty from "../../../util/typescript/forEachOwnProperty";
import forDownload from "../../forDownload";
import {mapGetDefault} from "../../../util/map";
import promiseAsResult from "../../../util/typescript/async/promiseAsResult";
import {partialSuccess, success} from "../../../util/typescript/result";
import {DatasetDispatchConstructor} from "./DatasetDispatch";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {Dataset} from "../../types/Dataset";
import {Action, ActionsDispatch, getActionsDispatch} from "./actions";
import {IN_PROGRESS} from "./symbols";
import {SELECTIONS} from "./selection";
import useStaticStateAccessor from "../../../util/react/hooks/useStaticStateAccessor";

export type GetAnnotationsGetterFunction<A> = (
    context: UFDLServerContext,
    pk: number
) => (filename: string) => Promise<A>

type DatasetReducer<D, A> = Reducer<Dataset<D, A>, Action<D, A>>

const DATASET_REDUCER = (currentState: any, action: any) => {
    return action(currentState)
}

export default function useDataset<
    D,
    A,
    DISC extends DatasetDispatchConstructor<D, A, any>
>(
    serverContext: UFDLServerContext,
    dataCacheContext: React.Context<DataCache<D>>,
    getAnnotations: GetAnnotationsGetterFunction<A>,
    initialAnnotations: A,
    dispatchConstructor: DISC,
    datasetPK?: DatasetPK
): InstanceType<DISC> | undefined {

    const dataCache = useContext(dataCacheContext);

    const [synchronised, addTask] = useTaskWatcher();

    const [reducerState, dispatch] = useReducer<DatasetReducer<D, A>, null>(
        DATASET_REDUCER,
        null,
        () => new Map()
    );

    const synchronisedAccessor = useStaticStateAccessor(synchronised);
    const datasetAccessor = useStaticStateAccessor(reducerState);

    const actionsDispatch: ActionsDispatch<D, A> = useDerivedState(
        () => getActionsDispatch(dispatch),
        [dispatch]
    )

    useEffect(
        () => {
            actionsDispatch.deleteItems(SELECTIONS.ALL);
            if (datasetPK !== undefined) {
                addTask(
                    loadDatasetInit(serverContext, datasetPK, dataCache, actionsDispatch, getAnnotations, initialAnnotations),
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
                datasetAccessor,
                synchronisedAccessor,
                datasetPK,
                actionsDispatch,
                serverContext,
                addTask,
                dataCache
            ),
        [
            datasetAccessor,
            synchronisedAccessor,
            datasetPK,
            actionsDispatch,
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
    dispatch: ActionsDispatch<D, A>,
    getAnnotationsGetter: GetAnnotationsGetterFunction<A>,
    initialAnnotations: A
): Promise<void> {
    // Get the dataset meta-data from the server
    const dataset = await DatasetCore.retrieve(context, pk.asNumber);

    // Begin loading the annotations from the server
    const annotationsGetter = getAnnotationsGetter(context, pk.asNumber);

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
            dispatch.addItems(
                {
                    filename: filename as string,
                    data: success({handle: handle, cache: dataCache}),
                    annotations: partialSuccess(IN_PROGRESS, initialAnnotations),
                    selected: false
                }
            )

            annotationPromises.push(
                promiseAsResult(
                    annotationsGetter(filename as string))
                    .then(
                        (result) => {
                            dispatch.updateItems(
                                () => {
                                    return {
                                        annotations: result
                                    }
                                },
                                SELECTIONS.isFile(filename as string)
                            )
                        }
                    )
                )
        }
    );

    await Promise.all(annotationPromises);
}