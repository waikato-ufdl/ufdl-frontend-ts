import {BehaviorSubject, Observable} from "rxjs";
import {RawJSONObject} from "ufdl-js-client/types";
import {filter, map} from "rxjs/operators";

export default function jobProgressSubject(
    observable: Observable<RawJSONObject>
): BehaviorSubject<number> {

    const subject = new BehaviorSubject<number>(0.0);

    const filterProgressUpdates = filter((value: RawJSONObject) => 'progress' in value && typeof value['progress'] === 'number');

    const extractProgress = map((value: RawJSONObject) => value['progress'] as number);

    extractProgress(filterProgressUpdates(observable)).subscribe(subject);
    
    return subject;
}
