import {FunctionComponentReturnType} from "../types";
import {TaskStatus} from "../../typescript/task/Task";
import {anyToString} from "../../typescript/strings/anyToString";
import LocalModal, {LocalModalProps} from "./LocalModal";
import {augmentClass} from "../augmentClass";
import capitalize from "../../typescript/strings/capitalize";
import "./TaskProgressModal.css"

export type HandleProgressMetadata = "ignore" | "latest" | "accumulate"

export type TaskProgressModalProps = LocalModalProps & {
    status: TaskStatus<unknown, unknown, void> | undefined
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

    const progressMetadataArray = status?.status !== "pending" || handleProgressMetadata === "ignore"
        ? []
        : handleProgressMetadata === "accumulate"
            ? status.progressMetadata
            : status.progressMetadata.slice(-1)

    const progressStrings = progressMetadataArray.map(
        metadata => <p>{anyToString(metadata)}</p>
    )

    const finalisedMessage = status === undefined || status.status === "pending" || finalised !== true
        ? ""
        : " (Finalised)"

    const statusMessage = status === undefined
        ? <p>Status: No current task</p>
        : <p>{`Status: ${capitalize(status.status)}${finalisedMessage}`}</p>

    const progress = status === undefined
        ? undefined
        : status.status === "pending"
            ? status.lastProgressPercent * 100
            : status.status === "completed"
                ? 100
                : undefined

    const progressString = progress !== undefined
        ? <p>{`Progress: ${progress.toFixed(2)}%`}</p>
        : undefined

    const reason = status === undefined
        ? undefined
        : status.status === "failed"
            ? anyToString(status.reason)
            : status.status === "cancelled"
                ? anyToString(status.reason)
                : undefined

    const reasonString = reason === undefined
        ? undefined
        : <p>{`Reason: ${reason}`}</p>

    const cancel = status !== undefined && status.status === "pending" && status.cancel !== undefined
        ? status.cancel
        : undefined

    const cancelButton = cancel !== undefined
        ? <button onClick={() => cancel()}>Cancel</button>
        : undefined

    return <LocalModal {...augmentClass(localModalProps, "TaskProgressModal")}>
        {statusMessage}
        {progressString}
        {reasonString}
        {cancelButton}
        {progressStrings}
    </LocalModal>
}