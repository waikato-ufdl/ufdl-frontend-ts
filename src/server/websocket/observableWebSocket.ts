import {Observable} from "rxjs";
import {TransitionHandlers} from "../types/TransitionHandlers";
import createWebSocket from "./createWebSocket";
import {RawJSONObject} from "ufdl-ts-client/types/raw";

export const CANCELLED = Symbol("The job was cancelled");

export default function observableWebSocket(
    jobPK: number,
    errorOnError: boolean = false,
    errorOnCancel: boolean = false
) {
    return new Observable<RawJSONObject>(
        (subscriber) => {
            const handlers: TransitionHandlers = {
                on_acquire(json) {subscriber.next(json)},
                on_release(json) {subscriber.next(json)},
                on_progress(json) {subscriber.next(json)},
                on_abort(json) {subscriber.next(json)},
                on_reset(json) {subscriber.next(json)},
                on_start(json) {subscriber.next(json)},
                on_finish(json) {
                    subscriber.next(json);
                    subscriber.complete();
                },
                on_error(json) {
                    subscriber.next(json);
                    if (errorOnError) subscriber.error(json['error']);
                },
                on_cancel(json) {
                    subscriber.next(json);
                    if (errorOnCancel)
                        subscriber.error(CANCELLED);
                    else
                        subscriber.complete();
                }
            };

            createWebSocket(jobPK, handlers);
        }
    )
}
