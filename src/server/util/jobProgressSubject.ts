import {BehaviorSubject, Observable} from "rxjs";
import {RawJSONObject} from "ufdl-ts-client/types/raw";
import {filter, map} from "rxjs/operators";
import behaviourSubjectFromSubscribable from "../../util/rx/behaviourSubjectFromSubscribable";

/**
 * Creates a behaviour subject which tracks the progress of a job.
 *
 * @param observable
 *          The observable web-socket connected to the job.
 * @return
 *          A behaviour subject tracking the progress value.
 */
export default function jobProgressSubject(
    observable: Observable<RawJSONObject>
): BehaviorSubject<number> {
    // Create an operator which filters to only updates containing a value for the progress amount
    const filterProgressUpdates = filter(
        (value: RawJSONObject) => {
            return 'progress' in value && typeof value['progress'] === 'number'
        }
    );

    // Create an operator which maps the JSON message to the progress amount
    const extractProgress = map(
        (value: RawJSONObject) => {
            return value['progress'] as number
        }
    );
    
    return behaviourSubjectFromSubscribable(
        extractProgress(filterProgressUpdates(observable)),
        0.0
    );
}
