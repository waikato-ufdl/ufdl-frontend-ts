import {Task, TaskStatus} from "../../typescript/task/Task";
import usePromise, {Resolution} from "./usePromise";
import {Forever} from "../../typescript/async/Forever";

/**
 * React hook which triggers updates when the task progresses.
 *
 * @param task
 *          The task to track, or undefined for no task.
 * @return
 *          The task's status, and the resolution of its finalisation,
 *          or undefined if no task was given.
 */
export default function useTask<Result, Metadata, CancelReason>(
    task: Task<Result, Metadata, CancelReason> | undefined
): [TaskStatus<Result, Metadata, CancelReason>, Resolution<void>] | undefined {

    // When the task is pending, track its completion/progress promises so
    // we can update the status, but we don't actually need the resolutions
    // of those promises as they are supplied in the task's status
    usePromise(task?.status.status === "pending" ? task.status.completion : undefined)
    usePromise(task?.status.status === "pending" ? task.status.nextProgress : undefined)

    // We do need the resolution of the finalisation though. If there is no task,
    // we just track a non-resolving promise, as the resolution is ignored anyway,
    // and this allows us to keep the type signature as Promise<void>.
    const finalisationPromiseResolution = usePromise(
        task === undefined
            ? Forever
            : task.status.finalisation
    )

    return task !== undefined
        ? [task.status, finalisationPromiseResolution]
        : undefined
}
