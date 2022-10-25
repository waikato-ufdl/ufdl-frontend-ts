import {rendezvous} from "../async/rendezvous";

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
 * The current status of a task.
 */
export type TaskStatus<Result, ProgressMetadata, CancelReason> =
    | Pending<Result, ProgressMetadata, CancelReason>
    | Completed<Result>
    | Failed
    | Cancelled<CancelReason>

/**
 * Status of a task that is still in-progress.
 *
 * @property status
 *          Always "pending".
 * @property completion
 *          A promise of the result of the task.
 * @property lastProgress
 *          The last progress update reported by the task.
 * @property nextProgress
 *          A promise of the next progress update to be reported by the task.
 * @property cancel
 *          A function to cancel the task.
 * @property finalised
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed).
 */
export type Pending<Result, ProgressMetadata, CancelReason> = {
    readonly status: "pending"
    readonly completion: Promise<Result>
    readonly lastProgress: Progress<ProgressMetadata>
    readonly nextProgress: Promise<Progress<ProgressMetadata>>
    readonly cancel?: (reason: CancelReason) => boolean
    readonly finalised: Promise<void>
}

/**
 * Status of a task that has finished successfully.
 *
 * @property status
 *          Always "completed".
 * @property result
 *          The task's resultant value.
 * @property finalised
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the result
 *          is available).
 */
export type Completed<Result> = {
    readonly status: "completed"
    readonly result: Result
    readonly finalised: Promise<void>
}

/**
 * Status of a task that finished unsuccessfully.
 *
 * @property status
 *          Always "failed".
 * @property reason
 *          The reason that the task failed.
 * @property finalised
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the failure
 *          is reported).
 * @property retry
 *          Method to start the task again (from the beginning). N.B.
 *          the original task-body is reused, so any internal state it
 *          may have is carried over to the subsequent invocation.
 */
export type Failed = {
    readonly status: "failed"
    readonly reason: any
    readonly finalised: Promise<void>
    readonly retry: () => void
}


/**
 * Status of a task that was cancelled.
 *
 * @property status
 *          Always "cancelled".
 * @property reason
 *          The reason that the task was cancelled.
 * @property finalised
 *          A promise that returns when the body of the task returns
 *          (maybe after some clean-up is performed after the cancellation).
 * @property retry
 *          Method to start the task again (from the beginning). N.B.
 *          the original task-body is reused, so any internal state it
 *          may have is carried over to the subsequent invocation.
 */
export type Cancelled<Reason> = {
    readonly status: "cancelled"
    readonly reason: Reason
    readonly finalised: Promise<void>
    readonly retry: () => void
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
    updateProgress: (percent: number, message?: ProgressMetadata) => boolean,
    checkForCancellation?: {
        (suppress?: false): Promise<void>,
        (suppress: boolean): Promise<CancelReason | undefined>
    }
) => Promise<void>

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

/**
 * A task is a long-running asynchronous process which can be cancelled,
 * and can provide progress updates to the task's initiator.
 */
export class Task<Result, ProgressMetadata = string, CancelReason = void> {

    /** The task's current status. */
    private _status: TaskStatus<Result, ProgressMetadata, CancelReason>;

    /**
     * Constructs a {@link Task}.
     *
     * @param body
     *          The executor body of the task. See {@link TaskBody}.
     * @param canBeCancelled
     *          Can optionally be set to false to indicate that the task can't
     *          cancelled.
     */
    constructor(
        body: TaskBody<Result, ProgressMetadata, CancelReason>,
        private readonly canBeCancelled: boolean = true
    ) {
        this._status = this.start(body);
    }

    /**
     * Gets the current status of the task.
     */
    get status(): TaskStatus<Result, ProgressMetadata, CancelReason> {
        return this._status;
    }

    /**
     * Creates all callbacks and internal state for a single execution of the task.
     *
     * @param body
     *          The executor body of the task. See {@link TaskBody}.
     */
    private start(
        body: TaskBody<Result, ProgressMetadata, CancelReason>
    ): Pending<Result, ProgressMetadata, CancelReason>
    {
        // Create a closure capturing this task to update its status
        const setStatus = (status: TaskStatus<Result, ProgressMetadata, CancelReason>) => {
            this._status = status
        }

        // Create a closure capturing this to restart the task
        const retry = () => setStatus(this.start(body))

        // Create the necessary promises for progressing, completing and finalising the task
        let progressRendezvous = rendezvous<Progress<ProgressMetadata>>()
        const [completionPromise, complete, fail] = rendezvous<Result>()
        const [finalisationPromise, finaliseSuccessfully, finaliseUnsuccessfully] = rendezvous<void>()

        // Create a common closure state for tracking the status of this invocation of the body
        // (the task's this._status tracks the status of the latest invocation, which may be
        // subsequent to this one)
        let status: TaskStatus<Result, ProgressMetadata, CancelReason>;

        // Create the callback which the body uses to complete the task
        function mutateOnComplete(result: Result): boolean {
            // Ensure callback semantics are observed, and check we aren't already cancelled
            switch (status.status) {
                case "completed": throw new TaskCallbackError("complete", "completed")
                case "failed": throw new TaskCallbackError("complete", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            // Update the progress to 100% on completion
            progressRendezvous[1]({ percent: 1.0 })

            // Update the status closure so it is visible to other callbacks
            status = {
                status: "completed",
                result: result,
                finalised: finalisationPromise
            }

            // Export the status to the Task object
            setStatus(status)

            // Resolve the completion promise
            complete(result)

            return true
        }

        // Create the callback which the body uses to fail the task
        function mutateOnFail(reason?: any): boolean {
            // Ensure callback semantics are observed, and check we aren't already cancelled
            switch (status.status) {
                case "completed": throw new TaskCallbackError("fail", "completed")
                case "failed": throw new TaskCallbackError("fail", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            // Fail the progress promise
            progressRendezvous[2](reason)

            // Update the status closure so it is visible to other callbacks
            status = {
                status: "failed",
                reason: reason,
                finalised: finalisationPromise,
                retry: retry
            }

            // Export the status to the Task object
            setStatus(status)

            // Reject the completion promise
            fail(reason)

            return true
        }

        // Create the callback which the body uses to update the task's progress
        function updateProgress(percent: number, message?: ProgressMetadata): boolean {
            // Ensure callback semantics are observed, and check we aren't already cancelled
            switch (status.status) {
                case "completed": throw new TaskCallbackError("updateProgress", "completed")
                case "failed": throw new TaskCallbackError("updateProgress", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            // Create the progress report
            const progress = { percent, message }

            // Resolve the current progress promise
            progressRendezvous[1](progress)

            // Create a new promise of the next progress
            progressRendezvous = rendezvous()

            // Update the status closure so it is visible to other callbacks
            status = {
                ...status,
                lastProgress: progress,
                nextProgress: progressRendezvous[0]
            }

            // Export the status to the Task object
            setStatus(status)

            return true
        }

        // Create the callback which the task initiator uses to cancel the task
        function cancel(reason: CancelReason): boolean {
            // Cancelling a finalised task is a no-op
            if (status.status !== "pending") return false

            // Fail the progress with the cancellation reason
            progressRendezvous[2](reason)

            // Update the status closure so it is visible to other callbacks
            status = {
                status: "cancelled",
                reason: reason,
                finalised: finalisationPromise,
                retry
            }

            // Export the status to the Task object
            setStatus(status)

            return true
        }

        // Create the callback which the body uses to check for task cancellation
        function checkForCancellation(suppress?: false): Promise<void>;
        function checkForCancellation(suppress: boolean): Promise<CancelReason | undefined>;
        function checkForCancellation(suppress: boolean = false): Promise<CancelReason | void> {
            // Ensure callback semantics are observed, and check we for cancellation,
            // resolving or rejecting as requested via 'suppress'
            switch (status.status) {
                case "completed": throw new TaskCallbackError("checkForCancellation", "completed")
                case "failed": throw new TaskCallbackError("checkForCancellation", "failed")
                case "cancelled":
                    if (suppress) {
                        return Promise.resolve(status.reason)
                    } else {
                        return Promise.reject(status.reason)
                    }
                case "pending": return Promise.resolve(undefined)
            }
        }

        // Set the initial status of the task
        status = {
            status: "pending",
            completion: completionPromise,
            lastProgress: { percent: 0.0 },
            nextProgress: progressRendezvous[0],
            cancel: this.canBeCancelled ? cancel : undefined,
            finalised: finalisationPromise
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
            if (status.status === "pending") {
                failAndFinaliseOnError(new TaskFinalisationError())
            } else {
                finaliseSuccessfully()
            }
        }

        // The body function could throw synchronously
        try {
            // Start the task
            const result = body(
                mutateOnComplete,
                mutateOnFail,
                updateProgress,
                this.canBeCancelled ? checkForCancellation : undefined
            )

            // Check for finalisation once it returns
            result.finally(checkForFinalisation)

        // If the task body throws synchronously, finalise the task unsuccessfully
        } catch (e) {
            // If the body synchronously called complete/fail, the task has finalised,
            // so reject the finalisation promise with the exception
            if (status.status !== "pending") {
                finaliseUnsuccessfully(e)

            // Otherwise the task threw before it could finalise, so fail the task
            // with the exception
            } else {
                failAndFinaliseOnError(e)
            }
        }

        return status
    }
}
