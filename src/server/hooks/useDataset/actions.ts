import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import {copyMap} from "../../../util/map";
import {Dispatch} from "react";
import {ItemSelector} from "./selection";

export type Action<D, A> = (item: Dataset<D, A>) => Dataset<D, A>

export type ActionsDispatch<D, A> = {
    addItems(...items: DatasetItem<D, A>[]): void
    deleteItems(itemSelection: ItemSelector<D, A>): void
    updateItems(
        update: (item: DatasetItem<D, A>) => Partial<Exclude<DatasetItem<D, A>, "filename">>,
        itemSelection: ItemSelector<D, A>
    ): void
}

export function getActionsDispatch<D, A>(
    reducerDispatch: Dispatch<Action<D, A>>
): ActionsDispatch<D, A> {
    return {
        addItems(
            ...items
        ) {
            reducerDispatch(
                (currentState: Dataset<D, A>) => {
                    const result = copyMap(currentState);
                    for (const item of items) result.set(
                        item.filename,
                        item
                    );
                    return result;
                }
            )
        },

        deleteItems(
            itemSelection
        ) {
            reducerDispatch(
                (currentState) => {
                    return copyMap(
                        currentState,
                        (_, item) => !itemSelection(item)
                    )
                }
            )
        },

        updateItems(
            update,
            itemSelection
        ) {
            reducerDispatch(
                (currentState) => {
                    return copyMap(
                        currentState,
                        (filename, item) => itemSelection(item)
                            ? [
                                filename,
                                {...item, ...update(item)}
                            ]
                            : true
                    );
                }
            )
        }
    }
}
