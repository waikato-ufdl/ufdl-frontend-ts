import {Data} from "../../types/data";
import {UseMutateFunction} from "react-query";
import {NamedFileInstance} from "ufdl-ts-client/types/core/named_file";
import {OptionalAnnotations} from "../../types/annotations";
import {TOGGLE} from "./selection";
import {DatasetDispatchItemSelector} from "./types";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {MutableDatasetDispatchItem} from "./DatasetDispatch";

export default function useDatasetMutationMethods<
    D extends Data,
    A,
    I extends MutableDatasetDispatchItem<D, A>
>(
    itemMap: ReadonlyMap<string, I>,
    fileOrdering: string[],
    addFilesMutate: UseMutateFunction<NamedFileInstance[], unknown, ReadonlyMap<string, D>>,
    deleteFileMutate: UseMutateFunction<NamedFileInstance, unknown, string>,
    setAnnotationsForFileMutate: UseMutateFunction<void, unknown, [string, OptionalAnnotations<A>]>,
    setSelected: React.Dispatch<[string, (boolean | typeof TOGGLE)]>
): [
    (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    () => void,
    (annotations: OptionalAnnotations<A>) => void,
    (filename: string, annotations: OptionalAnnotations<A>) => void,
    (modifications: ReadonlyMap<string, OptionalAnnotations<A>>) => void,
    () => void,
    (filename: string) => boolean,
    (files: ReadonlyMap<string, D>) => void
] {

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

    const deleteSelectedFiles: () => void = useDerivedState(
        ([itemMap, fileOrdering, deleteFileMutate]) => {
            return () => {
                for (const filename of fileOrdering) {
                    if (itemMap.get(filename)!.selected) {
                        deleteFileMutate(filename)
                    }
                }
            }
        },
        [itemMap, fileOrdering, deleteFileMutate] as const
    )

    const setAnnotationsForSelected: (annotations: OptionalAnnotations<A>) => void = useDerivedState(
        ([itemMap, fileOrdering, setAnnotationsForFileMutate]) => {
            return (annotations) => {
                for (const filename of fileOrdering) {
                    if (itemMap.get(filename)!.selected) {
                        setAnnotationsForFileMutate([filename, annotations])
                    }
                }
            }
        },
        [itemMap, fileOrdering, setAnnotationsForFileMutate] as const
    )

    const setAnnotationsForFile: (filename: string, annotations: OptionalAnnotations<A>) => void = useDerivedState(
        ([setAnnotationsForFileMutate]) => {
            return (filename, annotations) => {
                setAnnotationsForFileMutate([filename, annotations])
            }
        },
        [setAnnotationsForFileMutate] as const
    )

    const setAnnotations: (modifications: ReadonlyMap<string, OptionalAnnotations<A>>) => void = useDerivedState(
        ([setAnnotationsForFileMutate]) => {
            return (modifications) => {
                for (const modification of modifications) {
                    setAnnotationsForFileMutate(modification)
                }
            }
        },
        [setAnnotationsForFileMutate] as const
    )

    const clear: () => void = useDerivedState(
        ([fileOrdering, deleteFileMutate]) => {
            return () => {
                for (const filename of fileOrdering) {
                    deleteFileMutate(filename)
                }
            }
        },
        [fileOrdering, deleteFileMutate] as const
    )

    const deleteFile: (filename: string) => boolean = useDerivedState(
        ([itemMap, deleteFileMutate]) => {
            return (filename) => {
                if (!itemMap.has(filename)) return false;
                deleteFileMutate(filename)
                return true;
            }
        },
        [itemMap, deleteFileMutate] as const
    )

    const addFiles: (files: ReadonlyMap<string, D>) => void = useDerivedState(
        ([addFilesMutate]) => {
            return (files) => {
                addFilesMutate(files)
            }
        },
        [addFilesMutate] as const
    )

    return [
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
    ]
}