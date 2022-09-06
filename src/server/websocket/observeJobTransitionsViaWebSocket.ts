import {Observable, Subscriber} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as Job from "ufdl-ts-client/functional/core/jobs/job";
import {JobTransitionHandlers, JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";

type JobTransitionHandler = (json: JobTransitionMessage) => void

export const CANCELLED = Symbol("The job was cancelled");
export const WEB_SOCKET_CLOSED_UNEXPECTEDLY = Symbol("The web-socket closed without warning");

export class WebSocketError {
    constructor(public readonly event: Event) {}
}

/**
 * Creates job transition-handlers which progress a subscriber.
 *
 * @param subscriber
 *          The subscriber to progress with messages from job transitions.
 * @param errorOnError
 *          Whether to error the subscriber on job error transitions.
 * @param errorOnCancel
 *          Whether to error the subscriber on job cancel transitions.
 */
function createJobTransitionHandlers(
    subscriber: Subscriber<JobTransitionMessage>,
    errorOnError: boolean,
    errorOnCancel: boolean
): JobTransitionHandlers {
    // Create a function for simply forwarding transition messages to the subscriber
    const forward: JobTransitionHandler = (json) => subscriber.next(json)

    // Create the error handler
    const error: JobTransitionHandler = errorOnError?
        (json) => { forward(json); subscriber.error(json['error']); return true }
        : forward

    // Create the cancel handler
    const cancel: JobTransitionHandler = errorOnCancel?
        (json) => { forward(json); subscriber.error(CANCELLED) }
        : forward

    return {
        acquire: forward,
        release: forward,
        progress: forward,
        abort: forward,
        reset: forward,
        start: forward,
        finish: forward,
        error: error,
        cancel: cancel
    }
}

/**
 * Completes/errors the subscriber based on how the websocket closed.
 *
 * @param subscriber
 *          The subscriber to finalise.
 * @param manuallyClosed
 *          Whether the websocket was asked to close client-side.
 */
function finaliseSubscriberOnWebsocketClose(
    subscriber: Subscriber<JobTransitionMessage>,
    manuallyClosed: boolean
) {
    if (!manuallyClosed)
        subscriber.error(WEB_SOCKET_CLOSED_UNEXPECTEDLY);
    else if (!subscriber.closed)
        subscriber.complete();
}

/**
 * Creates an observable which receives job-transition messages via a
 * web-socket connection to the backend.
 *
 * @param context
 *          The connection to the backend.
 * @param jobPK
 *          The job to monitor.
 * @param errorOnError
 *          Whether to error the observable on job error transitions.
 * @param errorOnCancel
 *          Whether to error the observable on job cancel transitions.
 */
export default function observeJobTransitionsViaWebSocket(
    context: UFDLServerContext,
    jobPK: number,
    errorOnError: boolean = false,
    errorOnCancel: boolean = false
): Observable<JobTransitionMessage> {
    return new Observable<JobTransitionMessage>(
        (subscriber) => {
            const handlers = createJobTransitionHandlers(subscriber, errorOnError, errorOnCancel)

            Job.connect_to_job(
                context,
                jobPK,
                handlers,
                (manuallyClosed) => finaliseSubscriberOnWebsocketClose(subscriber, manuallyClosed),
                (event) => subscriber.error(new WebSocketError(event))
            );
        }
    )
}
