import {DatasetItem} from "../../types/DatasetItem";
import {Dataset} from "../../types/Dataset";
import {Predicate} from "../../../util/typescript/predicate";

export type ItemSelector<D, A> = Predicate<DatasetItem<D, A>>

export const SELECTIONS = {
    ALL() { return true },
    NONE() { return false },
    SELECTED(item: DatasetItem<any, any>) { return item.selected },
    UNSELECTED(item: DatasetItem<any, any>) { return !item.selected },
    forEval<D, A>(
        evalDataset: Dataset<D, A>,
        func: (
            item: DatasetItem<D, A>,
            evalItem?: DatasetItem<D, A>
        ) => boolean
    ): ItemSelector<D, A> {
        return (item) => func(item, evalDataset.get(item.filename));
    },
    isFile(filename: string): ItemSelector<any, any> {
        return (item) => item.filename === filename
    },
    inFiles(...filenames: string[]): ItemSelector<any, any> {
        const fileSet = new Set(filenames);
        return (item) => fileSet.has(item.filename);
    }
} as const;
