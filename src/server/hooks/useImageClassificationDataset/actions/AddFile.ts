import {DatasetItem} from "../../../DatasetItem";
import {ImageClassificationDataset} from "../ImageClassificationDataset";
import {copyMap} from "../../../../util/map";

export const ADD_FILE = Symbol("add file");

export type AddFileAction = {
    type: typeof ADD_FILE
    filename: string
    file: DatasetItem<string>
}

export function createAddFileAction(
    filename: string,
    file: DatasetItem<string>
): AddFileAction {
    return {
        type: ADD_FILE,
        filename: filename,
        file: file
    }
}

export function addFileAction(
    currentState: ImageClassificationDataset,
    action: AddFileAction
): ImageClassificationDataset {
    const result = copyMap(currentState);
    result.set(action.filename, {...action.file, resident: true});
    return result;
}
