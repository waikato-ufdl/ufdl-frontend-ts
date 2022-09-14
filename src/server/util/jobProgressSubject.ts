import {BehaviorSubject, Observable} from "rxjs";
import {map} from "rxjs/operators";
import behaviourSubjectFromSubscribable from "../../util/rx/behaviourSubjectFromSubscribable";
import {JobTransitionMessage} from "../../../../ufdl-ts-client/dist/types/core/jobs/job";
import {Empty} from "../../util/typescript/types/Empty";

/**
 * Creates a behaviour subject which tracks the progress of a job.
 *
 * @param observable
 *          The observable web-socket connected to the job.
 * @return
 *          A behaviour subject tracking the progress value.
 */
export default function jobProgressSubject(
    observable: Observable<JobTransitionMessage | Empty>
): BehaviorSubject<[number, string | undefined]> {
    // Create an operator which maps the JSON message to the progress amount
    const extractProgress = map<JobTransitionMessage | Empty, [number, string | undefined]>(
        (value: JobTransitionMessage | Empty) => {
            let message: string | undefined = undefined
            switch (value.transition) {
                case "start":
                    message = "Started"
                    break
                case "progress":
                    if (
                        value.transition_data !== undefined
                        && 'comment' in value.transition_data
                        && typeof value.transition_data.comment === "string"
                    ) {
                        message = value.transition_data.comment
                    }
                    break
                case "abort":
                    message = "Aborted"
                    break
            }
            return [value.progress ?? 0.0, message]
        }
    );
    
    return behaviourSubjectFromSubscribable<[number, string | undefined]>(
        extractProgress(observable),
        [0.0, undefined]
    );
}
