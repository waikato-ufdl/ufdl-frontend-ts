import {SelectFunction} from "./SelectFunction";
import {Dataset} from "../../../types/Dataset";
import {DatasetItem} from "../../../types/DatasetItem";

export const SELECT_ALL: SelectFunction<any, any> = () => true;

export const SELECT_NONE: SelectFunction<any, any> = () => false;

export function toggleSelection(filename: string): SelectFunction<any, any> {
    return (name, item) => {
        return filename === name ? !item.selected : item.selected;
    }
}

export function selectBasedOnEval<D, A>(
    evalDataset: Dataset<D, A>,
    func: (
        item: DatasetItem<D, A>,
        evalItem?: DatasetItem<D, A>
    ) => boolean
): SelectFunction<D, A> {
    return (filename, item) => {

        return func(
            item,
            evalDataset.get(filename)
        );
    }
}
