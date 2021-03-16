import {ImageClassificationDataset} from "./ImageClassificationDataset";
import {ImageClassificationDatasetAction} from "./actions/actions";
import {INIT, initAction} from "./actions/Init";
import {SELECT, selectAction} from "./actions/Select";
import {ADD_FILE, addFileAction} from "./actions/AddFile";
import {DELETE_FILE, deleteFileAction} from "./actions/DeleteFile";
import {CLEAR, clearAction} from "./actions/Clear";
import {SET_LABEL, setLabelAction} from "./actions/SetLabel";

export type ImageClassificationDatasetReducer = (
    currentState: ImageClassificationDataset,
    action: ImageClassificationDatasetAction
) => ImageClassificationDataset

export function imageClassificationDatasetReducer(
    currentState: ImageClassificationDataset,
    action: ImageClassificationDatasetAction
): ImageClassificationDataset {
    switch (action.type) {
        case INIT: return initAction(currentState, action);
        case SELECT: return selectAction(currentState, action);
        case ADD_FILE: return addFileAction(currentState, action);
        case DELETE_FILE: return deleteFileAction(currentState, action);
        case CLEAR: return clearAction(currentState, action);
        case SET_LABEL: return setLabelAction(currentState, action);
    }
}
