import {BehaviorSubject, OperatorFunction, UnaryFunction} from "rxjs";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";

/** The type of an operator function on behaviour subjects. */
export interface BehaviourSubjectOperatorFunction<T, R>
    extends UnaryFunction<BehaviorSubject<T>, BehaviorSubject<R>> {}

/**
 * Converts an operator function into one that operates on behaviour subjects.
 *
 * @param operatorFunction
 *          The operator function.
 */
export default function behaviourSubjectOperatorFunction<T, R>(
    operatorFunction: OperatorFunction<T, R>
): BehaviourSubjectOperatorFunction<T, R> {
    // Because the source is a behaviour subject, the initial value will be overwritten
    // immediately, so fudge it with null
    return (source) => {
        return behaviourSubjectFromSubscribable(operatorFunction(source), null) as any;
    }
}
