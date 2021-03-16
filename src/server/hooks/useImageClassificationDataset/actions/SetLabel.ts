import {ImageClassificationDataset} from "../ImageClassificationDataset";
import {spreadJoinMaps} from "../../../../util/map";
import {DatasetItem} from "../../../DatasetItem";

export const SET_LABEL = Symbol("set label");

export type SetLabelAction = {
    type: typeof SET_LABEL
    filename: string
    label: string | undefined
}

export function createSetLabelAction(
    filename: string,
    label: string | undefined
): SetLabelAction {
    return {
        type: SET_LABEL,
        filename: filename,
        label: label
    }
}

export function setLabelAction(
    currentState: ImageClassificationDataset,
    action: SetLabelAction
): ImageClassificationDataset {
    const current = currentState.get(action.filename);

    if (current === undefined) return currentState;

    return spreadJoinMaps(
        currentState,
        [action.filename, {...current, annotations: action.label}]
    )
}