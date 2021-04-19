import {BehaviorSubject} from "rxjs";

/**
 * Determines if the provided argument is a behaviour subject.
 *
 * @param value
 *          The value to check.
 * @return
 *          true if the argument is a behaviour subject, false if not.
 */
export default function isBehaviourSubject(
    value: any
): value is BehaviorSubject<any> {
    return value instanceof BehaviorSubject;
}
