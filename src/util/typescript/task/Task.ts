import {rendezvous} from "../async/rendezvous";
import {Forever} from "../async/Forever";
import {identity} from "../../identity";
import {directMapObject, mapOwnProperties} from "../object";
import promiseAsResult from "../async/promiseAsResult";
import {raceKeyed} from "../async/raceKeyed";
import {allKeyed} from "../async/allkeyed";
import mapPromise from "../async/mapPromise";
import doAsync from "../async/doAsync";
import {tryMap} from "../error/tryMap";

/**
 * A report on a task's progress.
 *
 * @property percent
 *          The proportion of the task completed (in [0.0, 1.0]).
 * @property metadata
 *          An optional message containing meta-data about the portion of
 *          the task just completed.
 */
export type Progress<Metadata> = {
    readonly percent: number
    readonly metadata?: Metadata
}

/**
 * The status of a finished task.
 */
export type FinishedTaskStatus<Result, ProgressMetadata, CancelledByReason> =
    | Completed<Result, ProgressMetadata>
    | Failed<ProgressMetadata>
    | Cancelled<CancelledByReason, ProgressMetadata>

/**
 * The current status of a task.
 */
export type TaskStatus<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends CancelledByReason = CancelledByReason
> =
    | Pending<Result, ProgressMetadata, CancelWithReason>
    | FinishedTaskStatus<Result, ProgressMetadata, CancelledByReason>

/**
 * Status of a task that is still in-progress.
 *
 * @property status
 *          Always "pending".
 * @property completion
 *          A promise of the result of the task.
 * @property lastProgressPercent
 *          The last progress amount update reported by the task.
 * @property progressMetadata
 *          The progress metadata reported thus far.
 * @property nextProgress
 *          A promise of the next progress update to be reported by the task.
 * @property cancel
 *          A function to cancel the task.
 * @property finalisation
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed).
 */
export type Pending<
    Result,
    ProgressMetadata,
    CancelReason
> = {
    readonly status: "pending"
    readonly completion: Promise<Result>
    readonly lastProgressPercent: number
    readonly progressMetadata: readonly ProgressMetadata[]
    readonly nextProgress: Promise<Progress<ProgressMetadata>>
    readonly cancel?: (reason: CancelReason) => boolean
    readonly finalisation: Promise<void>
}

/**
 * Status of a task that has finished successfully.
 *
 * @property status
 *          Always "completed".
 * @property result
 *          The task's resultant value.
 * @property finalisation
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the result
 *          is available).
 */
export type Completed<Result, ProgressMetadata> = {
    readonly status: "completed"
    readonly result: Result
    readonly progressMetadata: readonly ProgressMetadata[]
    readonly finalisation: Promise<void>
}

/**
 * Status of a task that finished unsuccessfully.
 *
 * @property status
 *          Always "failed".
 * @property reason
 *          The reason that the task failed.
 * @property finalisation
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the failure
 *          is reported).
 */
export type Failed<ProgressMetadata> = {
    readonly status: "failed"
    readonly reason: any
    readonly lastProgressPercent: number
    readonly progressMetadata: readonly ProgressMetadata[]
    readonly finalisation: Promise<void>
}


/**
 * Status of a task that was cancelled.
 *
 * @property status
 *          Always "cancelled".
 * @property reason
 *          The reason that the task was cancelled.
 * @property finalisation
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the cancellation).
 */
export type Cancelled<Reason, ProgressMetadata> = {
    readonly status: "cancelled"
    readonly reason: Reason
    readonly lastProgressPercent: number
    readonly progressMetadata: readonly ProgressMetadata[]
    readonly finalisation: Promise<void>
}

/**
 * The type of the executor-body of a task.
 *
 * @param complete
 *          Callback to mark the task as completed. Should not be called after either
 *          complete or fail has already been called. Returns false if the completion
 *          was ignored because the task had already been cancelled, otherwise true.
 * @param fail
 *          Callback to mark the task as failed. Should not be called after either
 *          complete or fail has already been called. Returns false if the failure
 *          was ignored because the task had already been cancelled, otherwise true.
 * @param updateProgress
 *          Callback for the task body to update observers about the progress of the
 *          task. Takes a progress amount argument in [0.0, 1.0], and optionally some
 *          meta-data about the current progress of the task.
 * @param checkForCancellation
 *          Callback to check if the task has been cancelled. Should not be called
 *          after either complete or fail has already been called. Takes an argument
 *          'suppress', which if true, returns the cancellation reason in-band (or
 *          undefined if not cancelled). If 'suppress' is false or omitted, the
 *          cancellation reason is thrown if there is one, otherwise this callback
 *          returns void. If undefined, it means the task will not be cancelled.
 * @return Promise<void>
 *          A void promise which indicates the task has finished. This is different
 *          from completion/failure in that clean-up may continue after the result
 *          of the task has been determined. Once this promise returns, the task has
 *          finalised all on-going activity.
 */
export type TaskBody<Result, ProgressMetadata = string, CancelReason = void> = (
    complete: (value: Result) => boolean,
    fail: (reason: any) => boolean,
    updateProgress: (percent: number, metadata?: ProgressMetadata) => boolean,
    checkForCancellation?: {
        (suppress?: false): Promise<void>,
        (suppress: true): Promise<CancelReason | undefined>
    }
) => Promise<void>

export type TaskResult<T extends Task<unknown, unknown, unknown, never>>
    = T extends Task<infer R, unknown, unknown, never> ? R : never

export type TaskProgressMetadata<T extends Task<unknown, unknown, unknown, never>>
    = T extends Task<unknown, infer P, unknown, never> ? P : never

export type TaskCancelledByReason<T extends Task<unknown, unknown, unknown, never>>
    = T extends Task<unknown, unknown, infer R, never> ? R : never

export type TaskCancelWithReason<T extends Task<unknown, unknown, unknown, never>>
    = T extends Task<unknown, unknown, infer R, infer R2> ? R2 & R : never

/**
 * Error for when the task's executor body tries to use a callback inappropriately.
 * Mainly for bug-detection.
 */
export class TaskCallbackError extends Error {
    /**
     * Constructs a {@link TaskCallbackError}.
     *
     * @param callback
     *          The callback that was called inappropriately.
     * @param status
     *          The status of the task when the callback was called.
     */
    constructor(
        callback: "complete" | "fail" | "checkForCancellation" | "updateProgress",
        status: "completed" | "failed" | "cancelled"
    ) {
        super(`Callback '${callback}' called when status is already '${status}'`);
    }
}

/**
 * Error indicating that a task body returned without finalising the task.
 */
export class TaskFinalisationError extends Error {
    /**
     * Constructs a {@link TaskFinalisationError}.
     */
    constructor() {
        super("Task body returned without finalisation");
    }
}

export class TaskProgressOutOfBoundsError extends Error {
    constructor(percent: number) {
        super(`Expected progress to be in [0.0, 1.0]; got ${percent}`);
    }
}

/**
 * A task is a long-running asynchronous process which can be cancelled,
 * and can provide progress updates to the task's initiator.
 */
export type Task<
    Result,
    ProgressMetadata = string,
    CancelledByReason = void,
    CancelWithReason extends CancelledByReason = CancelledByReason
> = {
    readonly status: TaskStatus<Result, ProgressMetadata, CancelledByReason, CancelWithReason>
    readonly cancellable: boolean
    readonly restart: (cancellable?: boolean) => Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>
}

/**
 * Creates all callbacks and internal state for a single execution of the task.
 *
 * @param body
 *          The executor body of the task. See {@link TaskBody}.
 */
export function startTask<
    Result,
    ProgressMetadata = string,
    CancelledByReason = void,
    CancelWithReason extends CancelledByReason = CancelledByReason
>(
    body: TaskBody<Result, ProgressMetadata, CancelledByReason>,
    cancellable: boolean = true
): Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason> {
    // Forward declare the task object itself
    let task: Task<Result, ProgressMetadata, CancelledByReason>

    // Create the necessary promises for progressing, completing and finalising the task
    let progressRendezvous = rendezvous<Progress<ProgressMetadata>>()
    const [completionPromise, complete, fail] = rendezvous<Result>()
    const [finalisationPromise, finaliseSuccessfully, finaliseUnsuccessfully] = rendezvous<void>()

    // Create a closure capturing this task to update its status
    const setStatus = (newStatus: TaskStatus<Result, ProgressMetadata, CancelledByReason>) => {
        (task as any).status = newStatus
    }

    // Create a closure capturing the body to restart the task
    const restart = (cancellable: boolean = true) => startTask(body, cancellable)

    const reportCancellation = () => !task.cancellable

    // Create the callback which the body uses to complete the task
    function mutateOnComplete(result: Result): boolean {
        // Ensure callback semantics are observed, and check we aren't already cancelled
        switch (task.status.status) {
            case "completed": throw new TaskCallbackError("complete", "completed")
            case "failed": throw new TaskCallbackError("complete", "failed")
            case "cancelled": return reportCancellation()
            case "pending":
                break;
        }

        // Update the progress to 100% on completion
        progressRendezvous[1]({ percent: 1.0 })

        // Set the new status of the task
        setStatus(
            {
                status: "completed",
                result: result,
                progressMetadata: task.status.progressMetadata,
                finalisation: finalisationPromise
            }
        )

        // Resolve the completion promise
        complete(result)

        return true
    }

    // Create the callback which the body uses to fail the task
    function mutateOnFail(reason?: any): boolean {
        // Ensure callback semantics are observed, and check we aren't already cancelled
        switch (task.status.status) {
            case "completed": throw new TaskCallbackError("fail", "completed")
            case "failed": throw new TaskCallbackError("fail", "failed")
            case "cancelled": return reportCancellation()
            case "pending":
                break;
        }

        // Fail the progress promise
        progressRendezvous[2](reason)

        // Set the new status of the task
        setStatus(
            {
                status: "failed",
                reason: reason,
                lastProgressPercent: task.status.lastProgressPercent,
                progressMetadata: task.status.progressMetadata,
                finalisation: finalisationPromise
            }
        )

        // Reject the completion promise
        fail(reason)

        return true
    }

    // Create the callback which the body uses to update the task's progress
    function updateProgress(percent: number, metadata?: ProgressMetadata): boolean {
        // Ensure callback semantics are observed, and check we aren't already cancelled
        switch (task.status.status) {
            case "completed": throw new TaskCallbackError("updateProgress", "completed")
            case "failed": throw new TaskCallbackError("updateProgress", "failed")
            case "cancelled": return reportCancellation()
            case "pending":
                break;
        }

        if (!Number.isFinite(percent) || percent < 0.0 || percent > 1.0) {
            throw new TaskProgressOutOfBoundsError(percent)
        }

        // Create the progress report
        const progress = { percent, metadata }

        // Resolve the current progress promise
        progressRendezvous[1](progress)

        // Create a new promise of the next progress
        progressRendezvous = rendezvous()

        // Set the new status of the task
        setStatus(
            {
                ...task.status,
                lastProgressPercent: progress.percent,
                progressMetadata: metadata === undefined
                    ? task.status.progressMetadata
                    : [...task.status.progressMetadata, metadata],
                nextProgress: progressRendezvous[0]
            }
        )

        return true
    }

    // Create the callback which the task initiator uses to cancel the task
    function cancel(reason: CancelledByReason): boolean {
        // Cancelling a finalised task is a no-op
        if (task.status.status !== "pending") return false

        // Fail the progress with the cancellation reason
        progressRendezvous[2](reason)

        // Set the new status of the task
        setStatus(
            {
                status: "cancelled",
                reason: reason,
                lastProgressPercent: task.status.lastProgressPercent,
                progressMetadata: task.status.progressMetadata,
                finalisation: finalisationPromise
            }
        )

        return true
    }

    // Create the callback which the body uses to check for task cancellation
    function checkForCancellation(suppress?: false): Promise<void>;
    function checkForCancellation(suppress: boolean): Promise<CancelledByReason | undefined>;
    function checkForCancellation(suppress: boolean = false): Promise<CancelledByReason | void> {
        // Ensure callback semantics are observed, and check we for cancellation,
        // resolving or rejecting as requested via 'suppress'
        switch (task.status.status) {
            case "completed": throw new TaskCallbackError("checkForCancellation", "completed")
            case "failed": throw new TaskCallbackError("checkForCancellation", "failed")
            case "cancelled":
                if (suppress) {
                    return Promise.resolve(task.status.reason)
                } else {
                    return Promise.reject(task.status.reason)
                }
            case "pending": return Promise.resolve(undefined)
        }
    }

    // Set the initial status of the task
    task = {
        status: {
            status: "pending",
            completion: completionPromise,
            lastProgressPercent: 0.0,
            progressMetadata: [],
            nextProgress: progressRendezvous[0],
            cancel: cancellable ? cancel : undefined,
            finalisation: finalisationPromise
        },
        cancellable,
        restart
    }

    // Create a helper function which fails the task and finalises it with
    // an error if it was not finalised by the task's body (the task's status
    // should be "pending" to call this, which is not checked).
    function failAndFinaliseOnError(error: any) {
        // Fail the task, progress-promise and the finalisation promise
        mutateOnFail(error)
        progressRendezvous[2](error)
        finaliseUnsuccessfully(error)
    }

    // Create a helper function which checks if the task is finalised, and
    // finalises it with an error if it is not, or resolves the finalisation
    // promise if it is.
    function checkForFinalisation() {
        if (task.status.status === "pending") {
            failAndFinaliseOnError(new TaskFinalisationError())
        } else {
            finaliseSuccessfully()
        }
    }

    function finaliseOnError(exception: any) {
        if (task.status.status === "pending") {
            failAndFinaliseOnError(exception)
        } else {
            finaliseUnsuccessfully(exception)
        }
    }

    // The body function could throw synchronously
    try {
        // Start the task
        const result = body(
            mutateOnComplete,
            mutateOnFail,
            updateProgress,
            task.cancellable ? checkForCancellation : undefined as any
        )

        // Check for finalisation once it returns
        result.then(
            checkForFinalisation,
            finaliseOnError
        )

    // If the task body throws synchronously, finalise the task unsuccessfully
    } catch (e) {
        finaliseOnError(e)
    }

    return task
}


export function getTaskCompletionPromise<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends CancelledByReason
>(
    task: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>
): Promise<Result> {
    const status = task.status
    switch (status.status) {
        case "completed":
            return Promise.resolve(status.result);
        case "pending":
            return status.completion;
        case "failed":
            return Promise.reject(status.reason);
        case "cancelled":
            return Promise.reject(status.reason);
    }
}

export function mapTaskProgress<ProgressMetadata, MappedProgressMetadata>(
    updateProgress: (percent: number, metadata?: MappedProgressMetadata) => boolean,
    mapMetadata: (metadata: ProgressMetadata) => MappedProgressMetadata,
    mapPercent: (percent: number) => number = identity
): (percent: number, metadata?: ProgressMetadata) => boolean {
    return (percent, metadata) => {
        return updateProgress(
            mapPercent(percent),
            metadata !== undefined
                ? mapMetadata(metadata)
                : undefined
        )
    }
}

export function taskFromPromise<Result>(
    promise: Promise<Result>
): Task<Result, never, never, never> {
    return startTask(
        async (complete) => {
            complete(await promise)
        },
        false
    )
}

export async function asSubTask<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends never
>(
    task: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>,
    updateProgress?: (percent: number, metadata?: ProgressMetadata) => void
): Promise<FinishedTaskStatus<Result, ProgressMetadata, CancelledByReason>>;

export async function asSubTask<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends CancelledByReason
>(
    task: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>,
    updateProgress?: (percent: number, metadata?: ProgressMetadata) => void,
    cancellationPromise?: Promise<CancelWithReason>
): Promise<TaskStatus<Result, ProgressMetadata, CancelledByReason, CancelWithReason>>;

export async function asSubTask<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends CancelledByReason
>(
    task: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>,
    updateProgress?: (percent: number, metadata?: ProgressMetadata) => void,
    cancellationPromise: Promise<CancelWithReason> = Forever
): Promise<TaskStatus<Result, ProgressMetadata, CancelledByReason, CancelWithReason>> {
    let status = task.status
    let reportedProgressMetadata = 0

    function reportProgress() {
        if (updateProgress === undefined) return
        const percent = status.status === "completed" ? 1.0 : status.lastProgressPercent
        if (reportedProgressMetadata === status.progressMetadata.length) {
            updateProgress(percent)
        } else {
            while (reportedProgressMetadata < status.progressMetadata.length) {
                const metadata = status.progressMetadata[reportedProgressMetadata++]
                updateProgress(percent, metadata)
            }
        }
    }

    while (status.status === "pending") {

        const promises = {
            result: promiseAsResult(status.completion),
            progress: updateProgress !== undefined ? promiseAsResult(status.nextProgress) : Forever,
            cancel: cancellationPromise
        } as const

        const indexedResult = await raceKeyed(
            promises,
            ['result', 'progress', 'cancel'] as const
        )

        // Refresh the status
        status = task.status

        switch (indexedResult[0]) {
            case 'result':
                // The task has entered a finished state, so next while-check will fail
                break;
            case 'progress':
                const progress = indexedResult[1].value
                if (progress !== undefined) {
                    reportProgress()
                }
                break;
            case 'cancel':
                if (status.status === "pending" && status.cancel !== undefined) {
                    status.cancel(indexedResult[1]);
                }
                return status;
        }
    }

    reportProgress()
    return status
}

export function mapTask<
    Result,
    ProgressMetadata,
    CancelledByReason,
    CancelWithReason extends CancelledByReason,
    MappedResult,
    MappedProgressMetadata,
    MappedCancelledByReason
>(
    task: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason>,
    mapResult: (result: Result) => MappedResult,
    mapProgressMetadata: (metadata: ProgressMetadata) => MappedProgressMetadata,
    mapCancelledBy: (reason: CancelledByReason) => MappedCancelledByReason,
    mapCancelWith?: (reason: MappedCancelledByReason) => CancelWithReason,
    mapProgressPercent: (percent: number) => number = identity,
    mapFailure: (reason: any) => any = identity
): Task<MappedResult, MappedProgressMetadata, MappedCancelledByReason> {

    return startTask(
        async (complete, fail, updateProgress, checkForCancellation) => {

            let cancellationPromise: Promise<CancelWithReason> | undefined = undefined

            if (checkForCancellation !== undefined && mapCancelWith !== undefined) {
                const [promise, resolve, reject] = rendezvous<MappedCancelledByReason>()

                doAsync(
                    async () => {
                        while (true) {
                            if (cancellationPromise !== undefined) {
                                const cancelledByReason = await checkForCancellation(true)
                                if (cancelledByReason === undefined) continue
                                resolve(cancelledByReason)
                            } else {
                                reject()
                            }
                            return
                        }
                    }
                )

                cancellationPromise = mapPromise(promise, mapCancelWith)
            }

            const status = await asSubTask(
                task,
                mapTaskProgress(
                    updateProgress,
                    mapProgressMetadata,
                    mapProgressPercent
                ),
                cancellationPromise
            )

            cancellationPromise = undefined

            switch (status.status) {
                case "completed":
                    complete(tryMap(status.result, mapResult, "mapResult"))
                    break;
                case "pending":
                    break;
                case "failed":
                    fail(tryMap(status.reason, mapFailure, "mapFailure"))
                    break;
                case "cancelled":
                    fail(tryMap(status.reason, mapCancelledBy, "mapCancelledBy"))
                    break;
            }
        }
    )

}

export type ParallelSubTasks<
    Keys extends PropertyKey = PropertyKey,
    Result = unknown,
    ProgressMetadata = unknown,
    CancelledByReason = unknown,
    CancelWithReason extends CancelledByReason = never
> = { [Key in Keys]: Task<Result, ProgressMetadata, CancelledByReason, CancelWithReason> }

function subTaskPromises<T extends ParallelSubTasks, K extends readonly (keyof T)[]>(
    subTasks: T,
    keys: K,
    followProgressOf: readonly (K[number])[],
    updateProgress: <Key extends K[number]>(
        key: Key,
        progress: number,
        metadata: TaskProgressMetadata<T[Key]> | undefined,
        progresses: { readonly [Key in K[number]]?: Progress<TaskProgressMetadata<T[Key]>> }
    ) => void,
    mapCancellations?: <Key extends K[number]>(key: Key) => Promise<TaskCancelWithReason<T[Key]>> | undefined
): { [Key in K[number]]?: Promise<T[Key]['status']>} {

    const progresses: { [Key in K[number]]?: Progress<TaskProgressMetadata<T[Key]>> }
        = {}

    return directMapObject(
        subTasks,
        keys,
        (key, subTask) => {
            const subTaskUpdateProgress
                = followProgressOf.findIndex(it => it === key) !== -1
                ? (percent: number, metadata?: TaskProgressMetadata<T[typeof key]>) => {
                    progresses[key] = {
                        percent,
                        metadata: metadata ?? progresses[key]?.metadata
                    }
                    return updateProgress(key, percent, metadata, progresses)
                }
                : undefined

            const cancellationPromise: Promise<TaskCancelWithReason<T[typeof key]>>
                = mapCancellations?.(key) ?? Forever

            return asSubTask<
                TaskResult<T[typeof key]>,
                TaskProgressMetadata<T[typeof key]>,
                TaskCancelledByReason<T[typeof key]>,
                TaskCancelWithReason<T[typeof key]>
            >(
                subTask as any,
                subTaskUpdateProgress,
                cancellationPromise
            )
        }
    ) as { [Key in K[number]]?: Promise<T[Key]['status']>}
}

export async function raceSubTasks<T extends ParallelSubTasks, K extends readonly (keyof T)[]>(
    subTasks: T,
    keys: K,
    followProgressOf: readonly (keyof T)[],
    updateProgress: <K extends keyof T>(
        key: K,
        progress: number,
        metadata: TaskProgressMetadata<T[K]> | undefined,
        progresses: { readonly [Key in keyof T]?: Progress<TaskProgressMetadata<T[Key]>> }
    ) => void,
    mapCancellations?: <K extends keyof T>(key: K) => Promise<TaskCancelWithReason<T[K]>> | undefined
): Promise<
    {
        [Key in K[number]]: [
            Key,
            TaskResult<T[Key]> | TaskCancelledByReason<T[Key]> | undefined
        ]
    }[K[number]]
> {
    const taskPromises = subTaskPromises(
        subTasks,
        keys,
        followProgressOf,
        updateProgress,
        mapCancellations
    )

    const [key, resultStatus] = await raceKeyed(taskPromises, keys)

    // We know resultStatus is defined because taskPromises is defined for all entries in keys
    const status = resultStatus!
    switch (status.status) {
        case "pending":
            return [key, undefined]
        case "completed":
            return [key, status.result as TaskResult<T[K[number]]>]
        case "cancelled":
            return [key, status.reason as TaskCancelledByReason<T[K[number]]>]
        case "failed":
            throw status.reason
    }
}

export async function allSubTasks<T extends ParallelSubTasks, K extends readonly (keyof T)[]>(
    subTasks: T,
    keys: K,
    followProgressOf: readonly (keyof T)[],
    updateProgress: <Key extends K[number]>(
        key: Key,
        progress: number,
        metadata: TaskProgressMetadata<T[Key]> | undefined,
        progresses: { readonly [Key in K[number]]?: Progress<TaskProgressMetadata<T[Key]>> }
    ) => void,
    mapCancellations?: <K extends keyof T>(key: K) => Promise<TaskCancelWithReason<T[K]>> | undefined
): Promise<{ [Key in K[number]]?: TaskResult<T[Key]> | TaskCancelledByReason<T[Key]> | undefined }> {

    const taskPromises = subTaskPromises(
        subTasks,
        keys,
        followProgressOf,
        updateProgress,
        mapCancellations
    )

    const allResults = await allKeyed(taskPromises, keys)

    return directMapObject(
        allResults,
        keys,
        (key, resultStatus) => {
            // We know resultStatus is defined because taskPromises is defined for all entries in keys
            const status = resultStatus!
            switch (status.status) {
                case "pending":
                    return undefined
                case "completed":
                    return status.result as TaskResult<T[typeof key]>
                case "cancelled":
                    return status.reason as TaskCancelledByReason<T[typeof key]>
                case "failed":
                    throw status.reason
            }
        }
    ) as { [Key in K[number]]?: TaskResult<T[Key]> | TaskCancelledByReason<T[Key]> | undefined }
}

export function subTasksAsTask<T extends ParallelSubTasks, K extends readonly (keyof T)[]>(
    subTasks: T,
    keys: K,
    taskCompleteMetadata?: <Key extends K[number]>(key: Key) => TaskProgressMetadata<T[Key]>
): Task<
    { [Key in K[number]]?: TaskResult<T[Key]> | TaskCancelledByReason<T[Key]> | undefined },
    TaskProgressMetadata<T[keyof T]>,
    never,
    never
> {
    return startTask(
        async (complete, _fail, progress) => {

            const results = await allSubTasks(
                subTasks,
                keys,
                keys,
                (key, percent, metadata, progresses) => {
                    const overallPercent
                        = mapOwnProperties(
                            progresses,
                            (_, prog) => prog!.percent
                        )
                        .reduce(
                            (previousValue, currentValue) => previousValue + currentValue,
                            0.0
                        ) / keys.length

                    if (percent === 1.0 && metadata === undefined && taskCompleteMetadata !== undefined) {
                        progress(overallPercent, taskCompleteMetadata(key))
                    } else {
                        progress(overallPercent, metadata)
                    }
                }
            )

            complete(results)
        },
        false
    )
}