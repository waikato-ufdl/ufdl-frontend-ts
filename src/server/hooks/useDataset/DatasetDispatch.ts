import {Dataset} from "../../types/Dataset";
import {DatasetItem} from "../../types/DatasetItem";
import {SelectFunction} from "./selection/SelectFunction";
import iteratorFilter from "../../../util/typescript/iterate/filter";
import Select from "./actions/Select";
import iteratorMap from "../../../util/typescript/iterate/map";
import {mapMap, mapSetDefault, mapToArray} from "../../../util/map";
import {Dispatch, ReducerAction} from "react";
import {DatasetReducer, DatasetReducerAction} from "./DatasetReducer";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {TaskDispatch} from "../../../util/react/hooks/useTaskWatcher";
import {DatasetPK} from "../../pk";
import {DataCache} from "../../DataCache";
import AddItem from "./actions/AddItem";
import UpdateItem from "./actions/UpdateItem";
import compressFiles from "../../util/compressFiles";
import * as DatasetCore from "ufdl-ts-client/functional/core/dataset";
import {mapResult, result} from "../../../util/typescript/result";
import promiseAsResult from "../../../util/typescript/async/promiseAsResult";
import DeleteItem from "./actions/DeleteItem";
import {discard} from "../../../util/typescript/discard";
import {SelfIterableIterator} from "../../../util/typescript/iterate/SelfIterableIterator";
import {iteratorReduce} from "../../../util/typescript/iterate/reduce";

export type DatasetDispatchConstructor<
    D,
    A,
    DRA extends DatasetReducerAction<unknown, D, A>,
    DIS extends DatasetDispatch<D, A, DRA>
>
    = {
        new (
            items: Dataset<D, A>,
            synchronised: boolean,
            pk: DatasetPK,
            dispatch: Dispatch<ReducerAction<DatasetReducer<D, A, DRA>>>,
            serverContext: UFDLServerContext,
            addTask: TaskDispatch,
            dataCache: DataCache<D>
        ): DIS
    }

export default abstract class DatasetDispatch<D, A, DRA extends DatasetReducerAction<unknown, D, A>> {
    constructor(
        readonly items: Dataset<D, A>,
        readonly synchronised: boolean,
        readonly pk: DatasetPK,
        protected readonly dispatch: Dispatch<ReducerAction<DatasetReducer<D, A, DRA>>>,
        protected readonly serverContext: UFDLServerContext,
        protected readonly addTask: TaskDispatch,
        protected readonly dataCache: DataCache<D>
    ) {}

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

    select(func: SelectFunction<D, A>): void {
        this.dispatch(new Select(func));
    }

    addFiles(files: ReadonlyMap<string, [Blob, A]>): void {
        this.addTask(
            this.addFilesInternal(files)
        )
    }

    deleteFiles(...filenames: string[]): void {
        this.addTask(
            this.deleteFilesInternal(filenames)
        )
    }

    deleteSelectedFiles(): void {
        this.deleteFiles(...iteratorMap(this.selected, (entry) => entry[0]));
    }

    deleteAllFiles(): void {
        this.deleteFiles(...mapToArray(this.items, (filename) => filename));
    }

    setAnnotations(
        annotations: ReadonlyMap<string, A>
    ): void {
        this.addTask(
            this.setAnnotationsInternal(annotations)
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

    protected async setAnnotationsInternal(
        annotations: ReadonlyMap<string, A>
    ): Promise<void> {
        const annotationPromises = this.addAnnotationsInternal(
            annotations
        );

        await Promise.all(
            mapToArray(
                annotationPromises,
                (filename, promise) => promiseAsResult(promise).then(
                    (result) => {
                        this.dispatch(
                            new UpdateItem(
                                {
                                    filename: filename,
                                    annotationsResident: mapResult(result, discard)
                                }
                            )
                        )
                    }
                )
            )
        )
    }

    protected abstract addAnnotationsInternal(
        annotations: ReadonlyMap<string, A>
    ): Map<string, Promise<unknown>>;

    private async addFilesInternal(
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

        const compressed = await compressFiles(dataMap);

        const filesAdded = await DatasetCore.add_files(
            this.serverContext,
            this.pk.asNumber,
            compressed
        );

        for (const {filename, handle} of filesAdded) {
            mapSetDefault(
                this.dataCache,
                handle,
                () => dataMap.get(filename)!
            );

            this.dispatch(
                new AddItem(
                    {
                        filename: filename,
                        dataHandle: handle,
                        dataCache: this.dataCache,
                        dataResident: result(true, undefined),
                        annotations: annotationMap.get(filename)!,
                        annotationsResident: result(false, "in progress"),
                        selected: false
                    }
                )
            )
        }

        await this.setAnnotationsInternal(
            annotationMap
        )
    }

    private async deleteFilesInternal(
        files: string[]
    ) {
        await Promise.all(
            files.map(
                (filename) => {
                    return promiseAsResult(
                        DatasetCore.delete_file(
                            this.serverContext,
                            this.pk.asNumber,
                            filename
                        )
                    ).then(
                        (result) => {
                            this.dispatch(
                                result.success
                                    ? new DeleteItem(filename)
                                    : new UpdateItem(
                                    {
                                        filename: filename,
                                        dataResident: result
                                    }
                                )
                            )
                        }
                    );
                }
            )
        )
    }

}