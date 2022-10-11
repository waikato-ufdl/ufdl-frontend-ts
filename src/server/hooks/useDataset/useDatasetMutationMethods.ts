import {Data} from "../../types/data";
import {NamedFileInstance} from "ufdl-ts-client/types/core/named_file";
import {OptionalAnnotations} from "../../types/annotations";
import {TOGGLE} from "./selection";
import {DatasetDispatchItemSelector, UseMutateFunctionWithCallbacks} from "./types";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {MutableDatasetDispatchItem} from "./DatasetDispatch";
import {rendezvous} from "../../../util/typescript/async/rendezvous";

export type DatasetMutationMethods<
    D extends Data,
    A
> = {
    select: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    deselect: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    toggleSelection: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    selectOnly: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    deleteSelectedFiles: () => void,
    setAnnotationsForSelected: (annotations: OptionalAnnotations<A>) => void,
    setAnnotationsForFile: (filename: string, annotations: OptionalAnnotations<A>) => void,
    setAnnotations: (modifications: ReadonlyMap<string, OptionalAnnotations<A>>) => void,
    clear: () => { [filename: string]: Promise<NamedFileInstance> },
    deleteFile: (filename: string) => Promise<NamedFileInstance> | undefined,
    addFiles: (files: ReadonlyMap<string, D>) => Promise<NamedFileInstance[]>
}

export default function useDatasetMutationMethods<
    D extends Data,
    A,
    I extends MutableDatasetDispatchItem<D, A>
>(
    itemMap: ReadonlyMap<string, I>,
    fileOrdering: string[],
    addFilesMutate: UseMutateFunctionWithCallbacks<NamedFileInstance[], unknown, ReadonlyMap<string, D>>,
    deleteFileMutate: UseMutateFunctionWithCallbacks<NamedFileInstance, unknown, string>,
    setAnnotationsForFileMutate: UseMutateFunctionWithCallbacks<void, unknown, [string, OptionalAnnotations<A>]>,
    setSelected: React.Dispatch<[string, (boolean | typeof TOGGLE)]>
): DatasetMutationMethods<D, A> {

    const select: (itemSelection: DatasetDispatchItemSelector<D, A>) => void = useDerivedState(
        ([itemMap, fileOrdering, setSelected]) => {
            return (itemSelection) => {
                for (const filename of fileOrdering) {
                    if (itemSelection(itemMap.get(filename)!, filename, itemMap)) {
                        setSelected([filename, true])
                    }
                }
            }
        },
        [itemMap, fileOrdering, setSelected] as const
    )

    const deselect: (itemSelection: DatasetDispatchItemSelector<D, A>) => void = useDerivedState(
        ([itemMap, fileOrdering, setSelected]) => {
            return (itemSelection) => {
                for (const filename of fileOrdering) {
                    if (itemSelection(itemMap.get(filename)!, filename, itemMap)) {
                        setSelected([filename, false])
                    }
                }
            }
        },
        [itemMap, fileOrdering, setSelected] as const
    )

    const toggleSelection: (itemSelection: DatasetDispatchItemSelector<D, A>) => void = useDerivedState(
        ([itemMap, fileOrdering, setSelected]) => {
            return (itemSelection) => {
                for (const filename of fileOrdering) {
                    if (itemSelection(itemMap.get(filename)!, filename, itemMap)) {
                        setSelected([filename, TOGGLE])
                    }
                }
            }
        },
        [itemMap, fileOrdering, setSelected] as const
    )

    const selectOnly: (itemSelection: DatasetDispatchItemSelector<D, A>) => void = useDerivedState(
        ([itemMap, fileOrdering, setSelected]) => {
            return (itemSelection) => {
                for (const filename of fileOrdering) {
                    if (itemSelection(itemMap.get(filename)!, filename, itemMap)) {
                        setSelected([filename, true])
                    } else {
                        setSelected([filename, false])
                    }
                }
            }
        },
        [itemMap, fileOrdering, setSelected] as const
    )

    const deleteSelectedFiles: () => { [filename: string]: Promise<NamedFileInstance> }
        = useDerivedState(
            ([itemMap, fileOrdering, deleteFileMutate]) => {
                return () => {
                    const results: { [filename: string]: Promise<NamedFileInstance> } = {}
                    for (const filename of fileOrdering) {
                        if (itemMap.get(filename)!.selected) {
                            const [promise, resolve, reject] = rendezvous<NamedFileInstance>()
                            deleteFileMutate([filename, resolve, reject])
                            results[filename] = promise
                        }
                    }
                    return results
                }
            },
            [itemMap, fileOrdering, deleteFileMutate] as const
        )

    const setAnnotationsForSelected: (annotations: OptionalAnnotations<A>) => { [filename: string]: Promise<void> }
        = useDerivedState(
            ([itemMap, fileOrdering, setAnnotationsForFileMutate]) => {
                return (annotations) => {
                    const results: { [filename: string]: Promise<void> } = {}
                    for (const filename of fileOrdering) {
                        if (itemMap.get(filename)!.selected) {
                            const [promise, resolve, reject] = rendezvous<void>()
                            setAnnotationsForFileMutate([[filename, annotations], resolve, reject])
                            results[filename] = promise
                        }
                    }
                    return results
                }
            },
            [itemMap, fileOrdering, setAnnotationsForFileMutate] as const
        )

    const setAnnotationsForFile: (filename: string, annotations: OptionalAnnotations<A>) => Promise<void>
        = useDerivedState(
            ([setAnnotationsForFileMutate]) => {
                return (filename, annotations) => {
                    const [promise, resolve, reject] = rendezvous<void>()
                    setAnnotationsForFileMutate([[filename, annotations], resolve, reject])
                    return promise
                }
            },
            [setAnnotationsForFileMutate] as const
        )

    const setAnnotations: (modifications: ReadonlyMap<string, OptionalAnnotations<A>>) => { [filename: string]: Promise<void> }
        = useDerivedState(
            ([setAnnotationsForFileMutate]) => {
                return (modifications) => {
                    const results: { [filename: string]: Promise<void> } = {}
                    for (const modification of modifications) {
                        const [promise, resolve, reject] = rendezvous<void>()
                        setAnnotationsForFileMutate([modification, resolve, reject])
                        results[modification[0]] = promise
                    }
                    return results
                }
            },
            [setAnnotationsForFileMutate] as const
        )

    const clear: () => { [filename: string]: Promise<NamedFileInstance> }
        = useDerivedState(
            ([fileOrdering, deleteFileMutate]) => {
                return () => {
                    const results: { [filename: string]: Promise<NamedFileInstance> } = {}
                    for (const filename of fileOrdering) {
                        const [promise, resolve, reject] = rendezvous<NamedFileInstance>()
                        deleteFileMutate([filename, resolve, reject])
                        results[filename] = promise
                    }
                    return results
                }
            },
            [fileOrdering, deleteFileMutate] as const
        )

    const deleteFile: (filename: string) => Promise<NamedFileInstance> | undefined
        = useDerivedState(
            ([itemMap, deleteFileMutate]) => {
                return (filename) => {
                    if (!itemMap.has(filename)) return undefined
                    const [promise, resolve, reject] = rendezvous<NamedFileInstance>()
                    deleteFileMutate([filename, resolve, reject])
                    return promise;
                }
            },
            [itemMap, deleteFileMutate] as const
        )

    const addFiles: (files: ReadonlyMap<string, D>) => Promise<NamedFileInstance[]>
        = useDerivedState(
            ([addFilesMutate]) => {
                return (files) => {
                    const [promise, resolve, reject] = rendezvous<NamedFileInstance[]>()
                    addFilesMutate([files, resolve, reject])
                    return promise
                }
            },
            [addFilesMutate] as const
        )

    return {
        select,
        deselect,
        toggleSelection,
        selectOnly,
        deleteSelectedFiles,
        setAnnotationsForSelected,
        setAnnotationsForFile,
        setAnnotations,
        clear,
        deleteFile,
        addFiles
    }
}