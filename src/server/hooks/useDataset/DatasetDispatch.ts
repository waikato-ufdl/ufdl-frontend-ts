import {Dataset} from "../../types/Dataset";
import {DatasetItem} from "../../types/DatasetItem";
import iteratorFilter from "../../../util/typescript/iterate/filter";
import iteratorMap from "../../../util/typescript/iterate/map";
import {mapMap, mapSetDefault, mapToArray} from "../../../util/map";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {TaskDispatch} from "../../../util/react/hooks/useTaskWatcher";
import {DatasetPK} from "../../pk";
import {DataCache} from "../../DataCache";
import compressFiles from "../../util/compressFiles";
import * as DatasetCore from "ufdl-ts-client/functional/core/dataset";
import {mapError, partialSuccess, success} from "../../../util/typescript/result";
import promiseAsResult from "../../../util/typescript/async/promiseAsResult";
import {SelfIterableIterator} from "../../../util/typescript/iterate/SelfIterableIterator";
import {iteratorReduce} from "../../../util/typescript/iterate/reduce";
import {IN_PROGRESS} from "./symbols";
import {ActionsDispatch} from "./actions";
import {ItemSelector, SELECTIONS} from "./selection";
import {StateAccessor} from "../../../util/react/hooks/useStaticStateAccessor";

export type DatasetDispatchConstructor<D, A, DIS extends DatasetDispatch<D, A>> = {
    new (
        items: StateAccessor<Dataset<D, A>>,
        synchronised: StateAccessor<boolean>,
        pk: DatasetPK,
        dispatch: ActionsDispatch<D, A>,
        serverContext: UFDLServerContext,
        addTask: TaskDispatch,
        dataCache: DataCache<D>
    ): DIS
}

export default abstract class DatasetDispatch<D, A> {

    constructor(
        private readonly _items: StateAccessor<Dataset<D, A>>,
        private readonly _synchronised: StateAccessor<boolean>,
        readonly pk: DatasetPK,
        protected readonly dispatch: ActionsDispatch<D, A>,
        protected readonly serverContext: UFDLServerContext,
        protected readonly addTask: TaskDispatch,
        protected readonly dataCache: DataCache<D>
    ) {}

    get items() {
        return this._items()
    }

    get synchronised() {
        return this._synchronised()
    }

    get selected(): SelfIterableIterator<[string, DatasetItem<D, A>]> {
        return iteratorFilter(
            this.items.entries(),
            (entry) => entry[1].selected
        )
    }

    get numSelected(): number {
        return iteratorReduce(
            this.selected,
            (acc) => acc + 1,
            0
        )
    }

    select(itemSelection: ItemSelector<D, A>): void {
        this.dispatch.updateItems(
            () => {
                return {
                    selected: true
                }
            },
            itemSelection
        );
    }

    deselect(itemSelection: ItemSelector<D, A>): void {
        this.dispatch.updateItems(
            () => {
                return {
                    selected: false
                }
            },
            itemSelection
        );
    }

    toggleSelection(
        itemSelection: ItemSelector<D, A>
    ) {
        this.dispatch.updateItems(
            (item) => {
                return {
                    selected: !item.selected
                }
            },
            itemSelection
        );
    }

    selectOnly(
        itemSelection: ItemSelector<D, A>
    ) {
        this.dispatch.updateItems(
            (item) => {
                return {
                    selected: itemSelection(item)
                }
            },
            SELECTIONS.ALL
        );

    }

    addFiles(files: ReadonlyMap<string, [Blob, A]>): void {
        this.addTask(
            this.addFilesToDataset(files)
        )
    }

    deleteFiles(...filenames: string[]): void {
        this.addTask(
            this.deleteFilesFromDataset(filenames)
        )
    }

    deleteSelectedFiles(): void {
        this.deleteFiles(
            ...iteratorMap(
                this.selected,
                (entry) => entry[0]
            )
        );
    }

    deleteAllFiles(): void {
        this.deleteFiles(
            ...mapToArray(
                this.items,
                (filename) => filename
            )
        );
    }

    setAnnotations(
        annotations: ReadonlyMap<string, A>
    ): void {
        this.addTask(
            this.setAnnotationsForDataset(annotations)
        );
    }

    setAnnotation(filename: string, annotation: A): void {
        return this.setAnnotations(new Map([[filename, annotation]]))
    }

    setAnnotationsForSelected(annotations: A): void {
        return this.setAnnotations(
            new Map(
                [
                    ...iteratorMap(
                        this.selected,
                        ([filename]) => [filename, annotations] as const
                    )
                ]
            )
        )
    }

    private async setAnnotationsForDataset(
        annotations: ReadonlyMap<string, A>
    ): Promise<void> {
        const annotationPromises = this.uploadAnnotationsForDataset(annotations);

        await Promise.all(
            mapToArray(
                annotationPromises,
                this.dispatchAnnotationsForItem.bind(this)
            )
        )
    }

    private async dispatchAnnotationsForItem(
        filename: string,
        promise: Promise<A>
    ) {
        const result = await promiseAsResult(promise);

        this.dispatch.updateItems(
            (item) => {
                if (result.success) return { annotations: result }

                switch (item.annotations.success) {
                    case true: return {annotations: partialSuccess(result.error, item.annotations.value)}
                    case false: return {annotations: result}
                    case undefined: return {annotations: partialSuccess(result.error, item.annotations.partialResult)}
                }
            },
            (item) => item.filename === filename
        )

    }

    /**
     * Uploads the annotations to the server.
     *
     * @param annotations
     *          Map from filename to the annotations value to set.
     * @return
     *          Map from each filename in [annotations] to a promise
     *          that will resolve to the annotations for the file when
     *          the upload has completed.
     * @protected
     */
    protected abstract uploadAnnotationsForDataset(
        annotations: ReadonlyMap<string, A>
    ): Map<string, Promise<A>>;

    private async addFilesToDataset(
        files: ReadonlyMap<string, [Blob, A]>
    ) {
        const dataMap = mapMap(
            files,
            (key, value) => [[key, value[0]]]
        )

        const annotationMap = mapMap(
            files,
            (key, value) => [[key, value[1]]]
        )

        // Add the files to the dataset as in-progress
        this.dispatch.addItems(
            ...mapToArray(
                files,
                (filename, [data, annotations]) => {
                    return {
                        filename: filename,
                        data: partialSuccess(IN_PROGRESS, [this.dataCache, data] as const),
                        annotations: partialSuccess(IN_PROGRESS, annotations),
                        selected: false
                    }
                }
            )
        )

        // Compress the file data for bulk upload
        const compressed = await promiseAsResult(compressFiles(dataMap));

        // Upload the files, or pass if compression failed
        const filesAdded = compressed.success
            ? await promiseAsResult(
                DatasetCore.add_files(
                    this.serverContext,
                    this.pk.asNumber,
                    compressed.value
                )
            )
            : compressed

        // If there was an error compressing or uploading the files, update items to indicate the error
        if (!filesAdded.success) {
            this.dispatch.updateItems(
                (item) => {
                    if (item.data.success !== undefined) throw new Error("Added item data not partial success")
                    if (item.annotations.success !== undefined) throw new Error("Added item annotations not partial success")

                    return {
                        data: partialSuccess(filesAdded.error, item.data.partialResult),
                        annotations: partialSuccess(filesAdded.error, item.annotations.partialResult)
                    }
                },
                (item) => files.has(item.filename)
            )
        } else {
            for (const {filename, handle} of filesAdded.value) {
                mapSetDefault(
                    this.dataCache,
                    handle,
                    () => dataMap.get(filename)!
                );

                this.dispatch.updateItems(
                    () => {
                        return {data: success({handle: handle, cache: this.dataCache})}
                    },
                    (item) => item.filename === filename
                )
            }

            await this.setAnnotationsForDataset(annotationMap)
        }
    }

    private async deleteFileFromDataset(
        filename: string
    ) {
        const result = await promiseAsResult(
            DatasetCore.delete_file(
                this.serverContext,
                this.pk.asNumber,
                filename
            )
        );

        const isFile = SELECTIONS.isFile(filename);

        if (result.success)
            this.dispatch.deleteItems(isFile)
        else
            this.dispatch.updateItems(
                (item) => {
                    return {
                        data: item.data.success
                            ? partialSuccess(result.error, item.data.value)
                            : mapError(item.data, () => result.error),
                        annotations: item.annotations.success
                            ? partialSuccess(result.error, item.annotations.value)
                            : mapError(item.annotations, () => result.error)
                    }
                },
                isFile
            )
    }

    private async deleteFilesFromDataset(
        files: string[]
    ) {
        await Promise.all(files.map(this.deleteFileFromDataset.bind(this)))
    }

}