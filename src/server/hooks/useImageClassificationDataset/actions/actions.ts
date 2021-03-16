import {ADD_FILE, addFileAction, AddFileAction} from "./AddFile";
import {CLEAR, clearAction, ClearAction} from "./Clear";
import {DELETE_FILE, deleteFileAction, DeleteFileAction} from "./DeleteFile";
import {INIT, initAction, InitAction} from "./Init";
import {SELECT, selectAction, SelectAction} from "./Select";
import {SET_LABEL, SetLabelAction, setLabelAction} from "./SetLabel";

export const Actions = [
    ADD_FILE,
    CLEAR,
    DELETE_FILE,
    INIT,
    SELECT,
    SET_LABEL
] as const;

export const ActionFunctions = {
    [ADD_FILE]: addFileAction,
    [CLEAR]: clearAction,
    [DELETE_FILE]: deleteFileAction,
    [INIT]: initAction,
    [SELECT]: selectAction,
    [SET_LABEL]: setLabelAction
} as const;

export type ActionSymbol = keyof typeof Actions[number]

export type ImageClassificationDatasetAction =
    | AddFileAction
    | ClearAction
    | DeleteFileAction
    | InitAction
    | SelectAction
    | SetLabelAction
