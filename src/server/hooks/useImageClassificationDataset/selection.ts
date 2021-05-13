import {Dataset} from "../../types/Dataset";
import {ItemSelector, SELECTIONS} from "../useDataset/selection";
import {Classification} from "../../types/annotations";
import {Image} from "../../types/data";

export const IC_SELECTIONS = {
    ...SELECTIONS,
    withClassification(
        classification: Classification
    ): ItemSelector<Image, Classification> {
        return (item) => {
            switch (item.annotations.success) {
                case true: return item.annotations.value === classification
                case undefined: return item.annotations.partialResult === classification
                case false: return false
            }
        }
    },
    correctForEval(
        evalDataset: Dataset<Image, Classification>
    ): ItemSelector<Image, Classification> {
        return this.forEval(
            evalDataset,
            (item, evalItem) => {
                if (evalItem === undefined) return false;

                if (!item.annotations.success || !evalItem.annotations.success) return false;

                return item.annotations.value === evalItem.annotations.value;
            }
        )
    },
    incorrectForEval(
        evalDataset: Dataset<Image, Classification>
    ): ItemSelector<Image, Classification> {
        return this.forEval(
            evalDataset,
            (item, evalItem) => {
                if (evalItem === undefined) return false;

                if (!item.annotations.success || !evalItem.annotations.success) return false;

                return item.annotations.value !== evalItem.annotations.value;
            }
        )
    }
} as const;