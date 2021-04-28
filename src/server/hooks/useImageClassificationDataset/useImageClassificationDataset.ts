import {useContext, useEffect, useReducer} from "react";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import {Optional} from "ufdl-ts-client/util";
import {
    imageClassificationDatasetReducer,
    ImageClassificationDatasetReducer
} from "./ImageClassificationDatasetReducer";
import {createInitAction} from "./actions/Init";
import {mapGetDefault, mapSetDefault, mapToArray} from "../../../util/map";
import {createSelectAction, SelectFunction} from "./actions/Select";
import {ImageClassificationDataset, ImageClassificationDatasetItem} from "./ImageClassificationDataset";
import {get_file} from "ufdl-ts-client/functional/image_classification/dataset";
import forDownload from "../../forDownload";
import {ImageClassificationDatasetAction} from "./actions/actions";
import {createAddFileAction} from "./actions/AddFile";
import {createDeleteFileAction} from "./actions/DeleteFile";
import {createSetLabelAction} from "./actions/SetLabel";
import {DatasetPK} from "../../pk";
import useTaskWatcher, {TaskDispatch} from "../../../util/react/hooks/useTaskWatcher";
import {FileCache, UFDL_FILE_CACHE_CONTEXT} from "../../FileCacheContext";
import forEachOwnProperty from "../../../util/typescript/forEachOwnProperty";
import {BehaviorSubject} from "rxjs";
import completionPromise from "../../../util/rx/completionPromise";

export type ImageClassificationDatasetMutator = {
    state: ImageClassificationDataset
    selectedFiles: string[]
    synchronised: boolean
    select(func: SelectFunction): void
    addFiles(files: ReadonlyMap<string, [Blob, string | undefined]>): void
    deleteFiles(...filenames: string[]): void
    deleteSelectedFiles(): void
    deleteAllFiles(): void
    setLabel(filename: string, label: string | undefined): void
    relabelSelectedFiles(label: string | undefined): void
}

export default function useImageClassificationDataset(context: UFDLServerContext): undefined
export default function useImageClassificationDataset(context: UFDLServerContext, pk: undefined): undefined
export default function useImageClassificationDataset(context: UFDLServerContext, pk: DatasetPK): ImageClassificationDatasetMutator
export default function useImageClassificationDataset(context: UFDLServerContext, pk: DatasetPK | undefined): ImageClassificationDatasetMutator | undefined
export default function useImageClassificationDataset(
    context: UFDLServerContext,
    datasetPK?: DatasetPK
): Optional<ImageClassificationDatasetMutator> {

    const imageCache = useContext(UFDL_FILE_CACHE_CONTEXT);

    const [synchronised, addTask] = useTaskWatcher();

    const [reducerState, dispatch] = useReducer<ImageClassificationDatasetReducer, null>(
        imageClassificationDatasetReducer,
        null,
        () => new Map()
    );

    useEffect(
        () => {
            async function onNewDataset(pk: DatasetPK) {
                const dataset = await loadDatasetInit(context, pk, imageCache);
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
        addFiles(files: ReadonlyMap<string, [Blob, string | undefined]>): void {
            addFiles(context, datasetPK, files, dispatch, addTask, imageCache)
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
    pk: DatasetPK,
    imageCache: FileCache
): Promise<ImageClassificationDataset> {
    const dataset = await ICDataset.retrieve(context, pk.asNumber);

    const categories = await ICDataset.get_categories(context, pk.asNumber) as {[filename: string]: string[]};

    function toItem(filename: string, handle: string): [string, ImageClassificationDatasetItem] {
        const categoriesForFile = categories[filename];
        const label = categoriesForFile !== undefined && categoriesForFile.length > 0 ?
            categoriesForFile[0] :
            undefined;

        // Trigger the caching of the image
        const data = mapGetDefault(
            imageCache,
            handle,
            () => forDownload(get_file)(context, pk.asNumber, filename),
            true
        );

        return [
            filename,
            {
                dataHandle: handle,
                dataCache: imageCache,
                resident: true,
                selected: false,
                annotations: label
            }
        ]
    }

    const files = dataset['files'] as {[filename: string]: string};

    const result = new Map();

    forEachOwnProperty(
        files,
        (filename, handle) => result.set(...toItem(filename as string, handle))
    );

    return result;
}

function addFiles(
    context: UFDLServerContext,
    pk: DatasetPK,
    files: ReadonlyMap<string, [Blob, string | undefined]>,
    dispatch: (action: ImageClassificationDatasetAction) => void,
    addTask: TaskDispatch,
    imageCache: FileCache
) {
    files.forEach(
        (file, filename) => {
            addTask(async () => {
                const [data, label] = file;

                const response = await ICDataset.add_file(
                    context,
                    pk.asNumber,
                    filename,
                    data
                );

                const handle = response.handle;

                mapSetDefault(
                    imageCache,
                    handle,
                    () => data
                );

                if (label !== undefined) {
                    await ICDataset.add_categories(
                        context,
                        pk.asNumber,
                        [filename],
                        [label]
                    );
                }

                dispatch(
                    createAddFileAction(
                        filename,
                        {
                            dataHandle: handle,
                            dataCache: imageCache,
                            resident: true,
                            selected: false,
                            annotations: file[1]
                        }
                    )
                );
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