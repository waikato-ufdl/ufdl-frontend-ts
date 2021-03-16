import {ImageClassificationDataset} from "../ImageClassificationDataset";

export const INIT = Symbol("Init");

export type InitAction = {
    type: typeof INIT
    dataset: ImageClassificationDataset
}

export function createInitAction(
    dataset: ImageClassificationDataset
): InitAction {
    return {
        type: INIT,
        dataset: dataset
    }
}

export function initAction(
    _: ImageClassificationDataset,
    action: InitAction
): ImageClassificationDataset {
    return action.dataset;
}
