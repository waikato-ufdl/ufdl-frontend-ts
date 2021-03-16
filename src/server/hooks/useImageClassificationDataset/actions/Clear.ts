import {ImageClassificationDataset} from "../ImageClassificationDataset";

export const CLEAR = Symbol("clear");

export type ClearAction = {
    type: typeof CLEAR
}

export function createClearAction(): ClearAction {
    return {
        type: CLEAR
    }
}

export function clearAction(
    _: ImageClassificationDataset,
    __: ClearAction
): ImageClassificationDataset {
    return new Map();
}
