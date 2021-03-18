import {BehaviorSubject, Subscribable} from "rxjs";

/**
 * Creates a behaviour subject which follows the given subscribable.
 *
 * @param subscribable
 *          The subscribable to follow.
 * @param initial
 *          The initial value of the behaviour subject.
 * @return
 *          The behaviour subject.
 */
export default function behaviourSubjectFromSubscribable<T>(
    subscribable: Subscribable<T>,
    initial: T
) {
    // Create the subject
    const subject = new BehaviorSubject(initial);

    // Subscribe it to the subscribable
    subscribable.subscribe(subject);

    return subject;
}
