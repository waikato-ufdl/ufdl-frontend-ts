import {Data} from "../../types/data";
import {NamedFileInstance} from "ufdl-ts-client/types/core/named_file";
import {OptionalAnnotations} from "../../types/annotations/OptionalAnnotations";
import {TOGGLE} from "./selection";
import {DatasetDispatchItemSelector, UseMutateFunctionWithTask} from "./types";
import useDerivedState from "../../../util/react/hooks/useDerivedState";
import {MutableDatasetDispatchItem} from "./DatasetDispatch";
import {rendezvous} from "../../../util/typescript/async/rendezvous";
import {
    asSubTask,
    getTaskCompletionPromise,
    startTask,
    Task
} from "../../../util/typescript/task/Task";

export type DatasetMutationMethods<
    D extends Data,
    A
> = {
    select: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    deselect: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    toggleSelection: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    selectOnly: (itemSelection: DatasetDispatchItemSelector<D, A>) => void,
    deleteSelectedFiles: () => Task<{ [filename: string]: NamedFileInstance | undefined}, string, never, never>,
    setAnnotationsForSelected: (annotations: OptionalAnnotations<A>) => void,
    setAnnotationsForFile: (filename: string, annotations: OptionalAnnotations<A>) => Promise<void>,
    setAnnotations: (modifications: ReadonlyMap<string, OptionalAnnotations<A>>) => Task<unknown, string, never, never>,
    clear: () => Task<{ [filename: string]: NamedFileInstance | undefined}, string, never, never>,
    deleteFile: (filename: string) => Task<{ [filename: string]: NamedFileInstance }, string, void, never> | undefined,
    addFiles: (files: ReadonlyMap<string, D>) => Task<NamedFileInstance[]>
}

export default function useDatasetMutationMethods<
    D extends Data,
    A,
    I extends MutableDatasetDispatchItem<D, A>
>(
    itemMap: ReadonlyMap<string, I>,
    fileOrdering: string[],
    addFilesMutate: UseMutateFunctionWithTask<
        Task<NamedFileInstance[]>,
        unknown,
        ReadonlyMap<string, D>
    >,
    deleteFilesMutate: UseMutateFunctionWithTask<
        Task<{ [filename: string]: NamedFileInstance }, string, never, never>,
        unknown,
        readonly string[]
    >,
    setAnnotationsMutate: UseMutateFunctionWithTask<
        Task<unknown, string, never, never>,
        unknown,
        ReadonlyMap<string, OptionalAnnotations<A>>
    >,
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

    const getDeleteFilesMutateTask = useMutateFunctionWithTask(
        deleteFilesMutate,
        false
    )

    const deleteSelectedFiles: () => Task<{ [filename: string]: NamedFileInstance | undefined}, string, never, never>
        = useDerivedState(
            ([itemMap, fileOrdering, getDeleteFilesMutateTask]) => {
                return () => {
                    const toDelete = fileOrdering.filter(filename => itemMap.get(filename)!.selected)

                    return getDeleteFilesMutateTask(toDelete)
                }
            },
            [itemMap, fileOrdering, getDeleteFilesMutateTask] as const
        )

    const getSetAnnotationsMutateTask = useMutateFunctionWithTask(
        setAnnotationsMutate,
        false
    )

    const setAnnotationsForSelected: (annotations: OptionalAnnotations<A>) => Task<unknown, string, never, never>
        = useDerivedState(
            ([itemMap, fileOrdering, getSetAnnotationsMutateTask]) => {
                return (annotations) => {
                    return getSetAnnotationsMutateTask(
                        new Map(
                            fileOrdering
                                .filter(filename => itemMap.get(filename)!.selected)
                                .map(filename => [filename, annotations] as const)
                        )
                    )
                }
            },
            [itemMap, fileOrdering, getSetAnnotationsMutateTask] as const
        )

    const setAnnotationsForFile: (filename: string, annotations: OptionalAnnotations<A>) => Promise<void>
        = useDerivedState(
            ([getSetAnnotationsMutateTask]) => {
                return async (filename, annotations) => {
                    await getTaskCompletionPromise(
                        getSetAnnotationsMutateTask(
                            new Map(
                                [[filename, annotations]]
                            )
                        )
                    )
                }
            },
            [getSetAnnotationsMutateTask] as const
        )

    const clear: () => Task<{ [filename: string]: NamedFileInstance }, string, never, never>
        = useDerivedState(
            ([fileOrdering, getDeleteFilesMutateTask]) => {
                return () => {
                    return getDeleteFilesMutateTask(fileOrdering)
                }
            },
            [fileOrdering, getDeleteFilesMutateTask] as const
        )

    const deleteFile: (filename: string) => Task<{ [filename: string]: NamedFileInstance }, string, void, never> | undefined
        = useDerivedState(
            ([itemMap, getDeleteFilesMutateTask]) => {
                return (filename: string) => {
                    if (!itemMap.has(filename)) return undefined
                    return getDeleteFilesMutateTask([filename])
                }
            },
            [itemMap, getDeleteFilesMutateTask] as const
        )

    const addFiles: (files: ReadonlyMap<string, D>) => Task<NamedFileInstance[]>
        = useMutateFunctionWithTask(addFilesMutate)

    return {
        select,
        deselect,
        toggleSelection,
        selectOnly,
        deleteSelectedFiles,
        setAnnotationsForSelected,
        setAnnotationsForFile,
        setAnnotations: getSetAnnotationsMutateTask,
        clear,
        deleteFile,
        addFiles
    }
}

function useMutateFunctionWithTask<TTask extends Task<unknown, unknown, unknown, never>, TError, TVariables, TContext>(
    mutateFn: UseMutateFunctionWithTask<TTask, TError, TVariables, TContext>,
    canBeCancelled: boolean = false
): (variables: TVariables) => TTask {
    return useDerivedState(
        ([mutateFn]) => {
            return (variables) => {
                return startTask(
                    async (complete, _, updateProgress) => {
                        const [subTaskPromise, resolveSubTask] = rendezvous<TTask>()
                        mutateFn([variables, resolveSubTask])
                        const subTask = await subTaskPromise
                        const subTaskStatus = await asSubTask(
                            subTask,
                            updateProgress
                        )
                        switch (subTaskStatus.status) {
                            case "completed":
                                complete(subTaskStatus.result)
                                break
                            case "failed":
                                throw subTaskStatus.reason
                            case "cancelled":
                                throw subTaskStatus.reason
                        }
                    },
                    canBeCancelled
                ) as TTask
            }
        },
        [mutateFn] as const
    )
}