import {useEffect, useReducer} from "react";
import UFDLServerContext from "ufdl-js-client/UFDLServerContext";
import * as ICDataset from "ufdl-js-client/functional/image_classification/dataset";
import {Optional} from "ufdl-js-client/util";
import {DatasetItem} from "../../DatasetItem";
import {
    imageClassificationDatasetReducer,
    ImageClassificationDatasetReducer
} from "./ImageClassificationDatasetReducer";
import {createInitAction} from "./actions/Init";
import {mapFromArray, mapToArray} from "../../../util/map";
import {createSelectAction, SelectFunction} from "./actions/Select";
import {ImageClassificationDataset} from "./ImageClassificationDataset";
import {fromServer} from "../../../image/fromServer";
import {ImageClassificationDatasetAction} from "./actions/actions";
import {createAddFileAction} from "./actions/AddFile";
import {createDeleteFileAction} from "./actions/DeleteFile";
import {createSetLabelAction} from "./actions/SetLabel";
import {DatasetPK} from "../../pk";
import useTaskWatcher, {TaskDispatch} from "../../../util/react/hooks/useTaskWatcher";
import {rendezvous} from "../../../util/typescript/async/rendezvous";

export type ImageClassificationDatasetMutator = {
    state: ImageClassificationDataset
    selectedFiles: string[]
    synchronised: boolean
    select(func: SelectFunction): void
    addFiles(files: ImageClassificationDataset): void
    deleteFiles(...filenames: string[]): void
    deleteSelectedFiles(): void
    deleteAllFiles(): void
    setLabel(filename: string, label: string | undefined): void
    relabelSelectedFiles(label: string | undefined): void
}

export default function useImageClassificationDataset(context: UFDLServerContext): undefined
export default function useImageClassificationDataset(context: UFDLServerContext, pk: undefined, evalDatasetPK?: DatasetPK): undefined
export default function useImageClassificationDataset(context: UFDLServerContext, pk: DatasetPK, evalDatasetPK?: DatasetPK): ImageClassificationDatasetMutator
export default function useImageClassificationDataset(context: UFDLServerContext, pk: DatasetPK | undefined, evalDatasetPK?: DatasetPK): ImageClassificationDatasetMutator | undefined
export default function useImageClassificationDataset(
    context: UFDLServerContext,
    datasetPK?: DatasetPK
): Optional<ImageClassificationDatasetMutator> {

    const [synchronised, addTask] = useTaskWatcher();

    const [reducerState, dispatch] = useReducer<ImageClassificationDatasetReducer, null>(
        imageClassificationDatasetReducer,
        null,
        () => new Map()
    );

    useEffect(
        () => {
            async function onNewDataset(pk: DatasetPK) {
                const dataset = await loadDatasetInit(context, pk);
                dispatch(createInitAction(dataset))
            }

            if (datasetPK !== undefined) {
                addTask(() => onNewDataset(datasetPK), true);
            }
        },
        [context, datasetPK]
    );

    if (datasetPK === undefined) return undefined;

    return {
        state: reducerState,
        get selectedFiles(): string[] {
            return mapToArray(
                reducerState,
                (filename, file) => file.selected ? filename : undefined
            ).filter(
                (filename) => filename !== undefined
            ) as string[];
        },
        synchronised: synchronised,
        addFiles(files: ReadonlyMap<string, DatasetItem<string>>): void {
            addFiles(context, datasetPK, files, dispatch, addTask)
        },
        deleteAllFiles(): void {
            this.deleteFiles(...mapToArray(reducerState, (filename) => filename));
        },
        deleteFiles(...filenames: string[]): void {
            deleteFiles(context, datasetPK, filenames, dispatch, addTask);
        },
        deleteSelectedFiles(): void {
            this.deleteFiles(...this.selectedFiles);
        },
        select(func: SelectFunction): void {
            dispatch(createSelectAction(func));
        },
        setLabel(filename: string, label: string | undefined) {
            addTask(async () => {
                setLabel(
                    context,
                    datasetPK,
                    filename,
                    label,
                    reducerState,
                    dispatch
                );
            });
        },
        relabelSelectedFiles(label: string | undefined): void {
            this.state.forEach(
                (item, filename) => {
                    if (item.selected) this.setLabel(filename, label);
                }
            )
        }
    }
}

async function loadDatasetInit(
    context: UFDLServerContext,
    pk: DatasetPK
): Promise<ImageClassificationDataset> {
    const dataset = await ICDataset.retrieve(context, pk.asNumber);

    const categories = await ICDataset.get_categories(context, pk.asNumber) as {[filename: string]: string[]};

    return mapFromArray(
        dataset['files'] as string[],
        (filename) => {
            const categoriesForFile = categories[filename];
            const label = categoriesForFile !== undefined && categoriesForFile.length > 0 ?
                categoriesForFile[0] :
                undefined;

            return [
                filename,
                {
                    data: fromServer(context, pk.asNumber, filename),
                    resident: true,
                    selected: false,
                    annotations: label
                }
            ]
        }
    );
}

function addFiles(
    context: UFDLServerContext,
    pk: DatasetPK,
    files: ReadonlyMap<string, DatasetItem<string>>,
    dispatch: (action: ImageClassificationDatasetAction) => void,
    addTask: TaskDispatch
) {
    files.forEach(
        (file, filename) => {
            addTask(async () => {
                const [promise, resolve, reject] = rendezvous<void>();

                const subscriber = {
                    complete: () => {
                        ICDataset.add_file(
                            context,
                            pk.asNumber,
                            filename,
                            file.data.getValue()
                        ).then(
                            () => {
                                if (file.annotations === undefined) return;
                                ICDataset.add_categories(
                                    context,
                                    pk.asNumber,
                                    [filename],
                                    [file.annotations]
                                )
                            }
                        ).then(
                            () => {
                                dispatch(createAddFileAction(filename, file));
                                resolve();
                            }
                        ).catch(reject);
                    }
                };

                file.data.subscribe(subscriber);

                await promise;
            });


        }
    );
}

function deleteFiles(
    context: UFDLServerContext,
    pk: DatasetPK,
    files: string[],
    dispatch: (action: ImageClassificationDatasetAction) => void,
    addTask: TaskDispatch
) {
    for (const filename of files) {
        addTask(async () => {
            await ICDataset.delete_file(context, pk.asNumber, filename);

            dispatch(createDeleteFileAction(filename));
        });
    }
}

async function setLabel(
    context: UFDLServerContext,
    pk: DatasetPK,
    filename: string,
    label: string | undefined,
    state: ImageClassificationDataset,
    dispatch: (action: ImageClassificationDatasetAction) => void
): Promise<void> {
    const current = state.get(filename);

    if (current === undefined) return;

    const currentLabel = current.annotations;

    const removeTask: Promise<any> = currentLabel !== undefined ?
        ICDataset.remove_categories(
            context,
            pk.asNumber,
            [filename],
            [currentLabel]
        ) :
        Promise.resolve();

    const removeAddTask = label !== undefined ?
        removeTask.then(
            () => {
                ICDataset.add_categories(
                    context,
                    pk.asNumber,
                    [filename],
                    [label]
                )
            }
        ) :
        removeTask;

    return removeAddTask.then(
        () => dispatch(createSetLabelAction(filename, label))
    );
}