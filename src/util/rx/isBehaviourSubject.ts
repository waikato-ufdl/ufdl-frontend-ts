import {BehaviorSubject} from "rxjs";

/**
 * Determines if the provided argument is a behaviour subject.
 *
 * @param value
 *          The value to check.
 * @return
 *          true if the argument is a behaviour subject, false if not.
 */
export default function isBehaviourSubject<T>(
    value: T
): value is T extends BehaviorSubject<any> ? T : never {
    return value instanceof BehaviorSubject;
}
