import {Observable} from "rxjs";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as Job from "ufdl-ts-client/functional/core/jobs/job";
import {JobTransitionHandlers, JobTransitionMessage} from "ufdl-ts-client/types/core/jobs/job";

export const CANCELLED = Symbol("The job was cancelled");
export const WEB_SOCKET_CLOSED_UNEXPECTEDLY = Symbol("The web-socket closed without warning");

export class WebSocketError {
    constructor(public readonly event: Event) {}
}

export default function observableWebSocket(
    context: UFDLServerContext,
    jobPK: number,
    errorOnError: boolean = false,
    errorOnCancel: boolean = false
): Observable<JobTransitionMessage> {
    return new Observable<JobTransitionMessage>(
        (subscriber) => {
            const handlers: JobTransitionHandlers = {
                acquire(json) {subscriber.next(json);},
                release(json) {subscriber.next(json)},
                progress(json) {subscriber.next(json)},
                abort(json) {subscriber.next(json)},
                reset(json) {subscriber.next(json)},
                start(json) {subscriber.next(json)},
                finish(json) {subscriber.next(json);},
                error(json) {
                    subscriber.next(json);
                    if (errorOnError) {
                        subscriber.error(json['error']);
                        return true;
                    }
                    return;
                },
                cancel(json) {
                    subscriber.next(json);
                    if (errorOnCancel) subscriber.error(CANCELLED);
                }
            };

            Job.connect_to_job(
                context,
                jobPK,
                handlers,
                (self) => {
                    if (!self)
                        subscriber.error(WEB_SOCKET_CLOSED_UNEXPECTEDLY);
                    else if (!subscriber.closed)
                        subscriber.complete();

                },
                (event) => subscriber.error(new WebSocketError(event))
            );
        }
    )
}
