import {ImageClassificationDataset} from "../ImageClassificationDataset";
import {filterMap} from "../../../../util/map";

export const DELETE_FILE = Symbol("delete file");

export type DeleteFileAction = {
    type: typeof DELETE_FILE
    filename: string
}

export function createDeleteFileAction(
    filename: string
): DeleteFileAction {
    return {
        type: DELETE_FILE,
        filename: filename
    }
}

export function deleteFileAction(
    currentState: ImageClassificationDataset,
    action: DeleteFileAction
): ImageClassificationDataset {
    if (!currentState.has(action.filename)) return currentState;

    return filterMap(
        currentState,
        (filename) => filename !== action.filename
    );
}
