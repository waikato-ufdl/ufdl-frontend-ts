import {Observable} from "rxjs";
import {TransitionHandlers} from "../types/TransitionHandlers";
import createWebSocket from "./createWebSocket";
import {RawJSONObject} from "ufdl-js-client/types";

export default function observableWebSocket(
    jobPK: number
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
                on_finish(json) {subscriber.next(json); subscriber.complete()},
                on_error(json) {subscriber.next(json)},
            };

            createWebSocket(jobPK, handlers);
        }
    )
}
