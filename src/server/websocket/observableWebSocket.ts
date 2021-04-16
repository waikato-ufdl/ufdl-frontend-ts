import {Observable} from "rxjs";
import {RawJSONObject} from "ufdl-ts-client/types/raw";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import * as Job from "ufdl-ts-client/functional/core/jobs/job";
import {JobTransitionHandlers} from "ufdl-ts-client/types/core/jobs/job";

export const CANCELLED = Symbol("The job was cancelled");

export default function observableWebSocket(
    context: UFDLServerContext,
    jobPK: number,
    errorOnError: boolean = false,
    errorOnCancel: boolean = false
) {
    return new Observable<RawJSONObject>(
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
                        subscriber.error({error: 'web-socket closed unexpectedly'});
                    else if (!subscriber.closed)
                        subscriber.complete();

                },
                (event) => console.error(`Web-socket connected to job #${jobPK} encountered an error:`, event)
            );
        }
    )
}
