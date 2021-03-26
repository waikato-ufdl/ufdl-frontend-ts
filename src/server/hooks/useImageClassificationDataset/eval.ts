import {ImageClassificationDataset} from "./ImageClassificationDataset";

export const NO_EVAL_LABEL = Symbol();

export type EvalLabel = string | undefined | typeof NO_EVAL_LABEL

export function getEvalLabel(
    dataset: ImageClassificationDataset | undefined,
    filename: string
): EvalLabel {
    if (dataset === undefined) return NO_EVAL_LABEL;
    return dataset.has(filename) ? dataset.get(filename)?.annotations : NO_EVAL_LABEL
}
