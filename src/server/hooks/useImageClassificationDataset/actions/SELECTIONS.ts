import {SelectFunction} from "./Select";
import {ImageClassificationDataset, ImageClassificationDatasetItem} from "../ImageClassificationDataset";
import {EvalLabel, getEvalLabel, NO_EVAL_LABEL} from "../eval";

export const SELECT_ALL: SelectFunction = () => true;
export const SELECT_NONE: SelectFunction = () => false;
export function toggleSelection(filename: string): SelectFunction {
    return (name, item) => {
        return filename === name ? !item.selected : undefined;
    }
}
export function selectLabel(label: string | undefined): SelectFunction {
    return (_, item) => {
        return item.annotations === label;
    }
}
export function selectBasedOnEval(
    evalDataset: ImageClassificationDataset,
    func: (filename: string, item: ImageClassificationDatasetItem, evalLabel: EvalLabel) => boolean | undefined
): SelectFunction {
    return (filename, item) => {
        return func(
            filename,
            item,
            getEvalLabel(evalDataset, filename)
        );
    }
}
export function selectCorrect(
    evalDataset: ImageClassificationDataset
): SelectFunction {
    return selectBasedOnEval(
        evalDataset,
        (_, item, evalLabel) => {
            return evalLabel !== undefined && item.annotations === evalLabel
        }
    )
}
export function selectIncorrect(
    evalDataset: ImageClassificationDataset
): SelectFunction {
    return selectBasedOnEval(
        evalDataset,
        (_, item, evalLabel) => {
            return evalLabel !== NO_EVAL_LABEL && item.annotations !== evalLabel
        }
    )
}