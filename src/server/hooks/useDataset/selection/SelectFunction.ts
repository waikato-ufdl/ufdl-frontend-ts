import {DatasetItem} from "../../../types/DatasetItem";

/** Function which determines whether an item should be selected. */
export type SelectFunction<D, A> = (filename: string, item: DatasetItem<D, A>) => boolean
