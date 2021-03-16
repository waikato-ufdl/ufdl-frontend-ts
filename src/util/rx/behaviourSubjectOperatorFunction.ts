import {BehaviorSubject, OperatorFunction, UnaryFunction} from "rxjs";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";

export interface BehaviourSubjectOperatorFunction<T, R>
    extends UnaryFunction<BehaviorSubject<T>, BehaviorSubject<R>> {}

export default function behaviourSubjectOperatorFunction<T, R>(
    func: OperatorFunction<T, R>
): BehaviourSubjectOperatorFunction<T, R> {
    // Because the source is a behaviour subject, the initial value will be overwritten
    // immediately, so fudge it with null
    return (source) => behaviourSubjectFromSubscribable(func(source), null) as any;
}
