import {rendezvous} from "../async/rendezvous";
import isPromise from "../async/isPromise";

export type Progress<P> = {
    readonly percent: number
    readonly message?: P
}

export type Pending<T, P, C> = {
    readonly status: "pending"
    readonly completion: Promise<T>
    readonly lastProgress: Progress<P>
    readonly nextProgress: Promise<Progress<P>>
    readonly cancel: (reason: C) => boolean
    readonly finalised: Promise<void>
}

export type Completed<T> = {
    readonly status: "completed"
    readonly outcome: T
    readonly finalised: Promise<void>
}

export type Failed = {
    readonly status: "failed"
    readonly reason: any
    readonly finalised: Promise<void>
    readonly retry: () => void
}

export type Cancelled<C> = {
    readonly status: "cancelled"
    readonly reason: C
    readonly finalised: Promise<void>
    readonly restart: () => void
}

export type TaskStatus<T, P, C> =
    | Pending<T, P, C>
    | Completed<T>
    | Failed
    | Cancelled<C>

export type TaskBody<T, P, C> = (
    complete: (value: T) => boolean,
    fail: (reason: any) => boolean,
    checkForCancellation: {
        (suppress?: false): Promise<void>,
        (suppress: boolean): Promise<C | void>
    },
    updateProgress: (percent: number, message?: P) => boolean
) => Promise<void> | void

export class TaskCallbackError extends Error {
    constructor(
        callback: "complete" | "fail" | "checkForCancellation" | "updateProgress",
        status: "completed" | "failed" | "cancelled"
    ) {
        super(`Callback '${callback}' called when status is already '${status}'`);
    }
}

export class TaskFinalisationError extends Error {
    constructor() {
        super("Task body returned without finalisation");
    }
}

export class Task<T, P = string, C = void> {

    private _status: TaskStatus<T, P, C>;

    constructor(
        body: TaskBody<T, P, C>
    ) {
        this._status = this.start(body);
    }

    private start(body: TaskBody<T, P, C>) {
        const task = this;

        const [completionPromise, complete, fail] = rendezvous<T>()
        const [finalisationPromise, finaliseSuccessfully, finaliseUnsuccessfully] = rendezvous<void>()
        let progressRendezvous = rendezvous<Progress<P>>()

        let status: TaskStatus<T, P, C>;

        function mutateOnComplete(value: T): boolean {
            switch (status.status) {
                case "completed": throw new TaskCallbackError("complete", "completed")
                case "failed": throw new TaskCallbackError("complete", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            // Update the progress to 100%
            progressRendezvous[1]({ percent: 1.0 })

            // Update the closure in case we are synchronously resolved
            status = {
                status: "completed",
                outcome: value,
                finalised: finalisationPromise
            }

            // Update the object in case we are asynchronously resolved
            task._status = status

            complete(value)

            return true
        }

        function mutateOnFail(reason?: any): boolean {
            switch (status.status) {
                case "completed": throw new TaskCallbackError("fail", "completed")
                case "failed": throw new TaskCallbackError("fail", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            // Fail the progress promise
            progressRendezvous[2](reason)

            // Update the closure in case we are synchronously rejected
            status = {
                status: "failed",
                reason: reason,
                finalised: finalisationPromise,
                retry: () => task._status = task.start(body)
            }

            // Update the object in case we are asynchronously rejected
            task._status = status

            fail(reason)

            return true
        }

        function updateProgress(percent: number, message?: P): boolean {
            switch (status.status) {
                case "completed": throw new TaskCallbackError("updateProgress", "completed")
                case "failed": throw new TaskCallbackError("updateProgress", "failed")
                case "cancelled": return false
                case "pending":
                    break;
            }

            const progress = { percent, message }

            // Resolve the current progress promise
            progressRendezvous[1](progress)

            // Create a new promise of the next progress
            progressRendezvous = rendezvous()

            status = {
                ...status,
                lastProgress: progress,
                nextProgress: progressRendezvous[0]
            }

            task._status = status

            return true
        }

        function cancel(reason: C): boolean {
            if (status.status !== "pending") return false

            // Update the object
            status = {
                status: "cancelled",
                reason: reason,
                finalised: finalisationPromise,
                restart: () => task._status = task.start(body)
            }

            task._status = status

            return true
        }

        async function checkForCancellation(suppress?: false): Promise<void>;
        async function checkForCancellation(suppress: boolean): Promise<C | void>;
        async function checkForCancellation(suppress: boolean = false): Promise<C | void> {
            switch (status.status) {
                case "completed": throw new TaskCallbackError("checkForCancellation", "completed")
                case "failed": throw new TaskCallbackError("checkForCancellation", "failed")
                case "cancelled": if (suppress) {
                    return Promise.resolve(status.reason)
                } else {
                    return Promise.reject(status.reason)
                }
                case "pending": return Promise.resolve()
            }
        }

        status = {
            status: "pending",
            completion: completionPromise,
            lastProgress: { percent: 0.0 },
            nextProgress: progressRendezvous[0],
            cancel: cancel,
            finalised: finalisationPromise
        }

        function finaliseOnError(error: any) {
            mutateOnFail(error)
            progressRendezvous[2](error)
            finaliseUnsuccessfully(error)
        }

        function checkForFinalisation() {
            if (status.status === "pending") {
                finaliseOnError(new TaskFinalisationError())
            } else {
                finaliseSuccessfully()
            }
        }

        try {
            const result = body(
                mutateOnComplete,
                mutateOnFail,
                checkForCancellation,
                updateProgress
            )

            if (isPromise(result)) {
                result.finally(checkForFinalisation)
            } else {
                checkForFinalisation()
            }
        } catch (e) {
            finaliseOnError(e)
        }

        return status
    }

    get status(): TaskStatus<T, P, C> {
        return this._status;
    }
}
