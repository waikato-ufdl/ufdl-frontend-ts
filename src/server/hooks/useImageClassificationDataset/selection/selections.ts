import {Classification} from "../../../types/annotations";
import {SelectFunction} from "../../useDataset/selection/SelectFunction";
import {selectBasedOnEval} from "../../useDataset/selection/selections";
import {Dataset} from "../../../types/Dataset";

export function selectClassification(
    classification: Classification
): SelectFunction<any, Classification> {
    return (_, item) => {
        return item.annotations === classification;
    }
}

export function selectCorrect(
    evalDataset: Dataset<any, Classification>
): SelectFunction<any, Classification> {
    return selectBasedOnEval(
        evalDataset,
        (item, evalItem) => {
            return evalItem !== undefined && item.annotations === evalItem.annotations
        }
    )
}

export function selectIncorrect(
    evalDataset: Dataset<any, Classification>
): SelectFunction<any, Classification> {
    return selectBasedOnEval(
        evalDataset,
        (item, evalItem) => {
            return evalItem !== undefined && item.annotations !== evalItem.annotations
        }
    )
}
