import {ImageClassificationDataset, ImageClassificationDatasetItem} from "../ImageClassificationDataset";
import {copyMap} from "../../../../util/map";

export const SELECT = Symbol("select");

export type SelectFunction = (filename: string, item: ImageClassificationDatasetItem) => boolean | undefined

export type SelectAction = {
    type: typeof SELECT
    selection: SelectFunction
}

export function createSelectAction(
    selection: SelectFunction
): SelectAction {
    return {
        type: SELECT,
        selection: selection
    }
}

export function selectAction(
    currentState: ImageClassificationDataset,
    action: SelectAction
): ImageClassificationDataset {
    let anyChanged: boolean = false;

    const newState = copyMap(
        currentState,
        (filename, item) => {
            const selected = action.selection(filename, item);
            if (selected === undefined || selected === item.selected) return true;
            anyChanged = true;
            return [filename, {...item, selected: selected}];
        }
    );

    return anyChanged ? newState : currentState;
}

