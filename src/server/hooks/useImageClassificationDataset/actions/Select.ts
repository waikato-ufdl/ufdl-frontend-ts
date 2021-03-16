import {ImageClassificationDataset} from "../ImageClassificationDataset";
import {copyMap} from "../../../../util/map";

export const SELECT = Symbol("select");

export const SelectAll = Symbol("Select All");
export const SelectNone = Symbol("Select None");

export type SelectionSpecifier = string | typeof SelectAll | typeof SelectNone

export type SelectAction = {
    type: typeof SELECT
    selection: SelectionSpecifier
}

export function createSelectAction(
    selection: SelectionSpecifier
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
    if (action.selection === SelectAll || action.selection === SelectNone) {
        return copyMap(
            currentState,
            (filename, item) => {
                return [filename, {...item, selected: action.selection === SelectAll}];
            }
        )
    } else {
        if (!currentState.has(action.selection)) return currentState;
        return copyMap(
            currentState,
            (filename, item) => {
                if (filename !== action.selection) return true;
                return [filename, {...item, selected: !item.selected}]
            }
        )
    }
}

