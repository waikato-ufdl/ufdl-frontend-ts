import {BehaviorSubject, Subscribable} from "rxjs";

export default function behaviourSubjectFromSubscribable<T>(
    subscribable: Subscribable<T>,
    initial: T
) {
    const subject = new BehaviorSubject(initial);

    subscribable.subscribe(subject);

    return subject;
}
