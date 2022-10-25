import {FunctionComponentReturnType} from "../types";
import {TaskStatus} from "../../typescript/task/Task";
import useDerivedReducer from "../hooks/useDerivedReducer";
import {createSimpleStateReducer} from "../hooks/SimpleStateReducer";
import {anyToString} from "../../typescript/strings/anyToString";
import LocalModal, {LocalModalProps} from "./LocalModal";
import {augmentClass} from "../augmentClass";
import capitalize from "../../typescript/strings/capitalize";

export type HandleProgressMetadata = "ignore" | "latest" | "accumulate"

function progressMetadataInitialiser(
    [metadata, handle]: readonly [unknown, HandleProgressMetadata],
    currentState: readonly string[]
): readonly string[] {
    if (handle === "ignore")
        return []
    else if (handle === "latest")
        if (metadata !== undefined)
            return [anyToString(metadata)]
        else if (currentState.length > 1)
            return [currentState[0]]
        else
            return currentState
    else if (metadata !== undefined)
        return [...currentState, anyToString(metadata)]
    else
        return currentState
}

export type TaskProgressModalProps = LocalModalProps & {
    status: TaskStatus<unknown, unknown, unknown> | undefined
    handleProgressMetadata: HandleProgressMetadata
    finalised?: boolean
}

export default function TaskProgressModal(
    {
        status,
        handleProgressMetadata,
        finalised,
        ...localModalProps
    }: TaskProgressModalProps
): FunctionComponentReturnType {

    const progressMetadata = useDerivedReducer(
        createSimpleStateReducer<readonly string[]>(),
        progressMetadataInitialiser,
        [
            status?.status === "pending" ? status.lastProgress.metadata : undefined,
            status !== undefined ? handleProgressMetadata : "ignore"
        ] as const,
        () => [] as readonly string[]
    )

    const finalisedMessage = status === undefined || status.status === "pending" || finalised !== true
        ? ""
        : " (Finalised)"

    const statusMessage = status === undefined
        ? "Status: No current task"
        : `Status: ${capitalize(status.status)}${finalisedMessage}`

    const progress = status === undefined
        ? undefined
        : status.status === "pending"
            ? status.lastProgress.percent * 100
            : status.status === "completed"
                ? 100
                : undefined

    const progressString = progress !== undefined ? `Progress: ${progress.toFixed(2)}%` : undefined

    const reason = status === undefined
        ? undefined
        : status.status === "failed"
            ? anyToString(status.reason)
            : status.status === "cancelled"
                ? anyToString(status.reason)
                : undefined

    const reasonString = reason === undefined ? undefined : `Reason: ${reason}`

    return <LocalModal {...augmentClass(localModalProps, "TaskProgressModal")}>
        {statusMessage}
        {progressString}
        {reasonString}
        {progressMetadata}
    </LocalModal>
}