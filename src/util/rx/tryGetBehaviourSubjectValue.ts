import {BehaviorSubject} from "rxjs";

/**
 * Attempts to get the value of a behaviour subject, invoking the
 * provided error handler if the subject has errored.
 *
 * @param subject
 *          The behaviour subject.
 * @param onError
 *          The error handler.
 * @return
 *          The value of the subject or the result of the handler.
 */
export default function tryGetBehaviourSubjectValue<T, R>(
    subject: BehaviorSubject<T>,
    onError: (err: any) => R
) : T | R {
    try {
        return subject.value;
    } catch (err) {
        return onError(err);
    }
}
