import {BehaviorSubject, of, OperatorFunction, UnaryFunction} from "rxjs";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";
import {concatAll} from "rxjs/operators";

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

        const initial = operatorFunction(of(source.value));

        const onGoing = operatorFunction(source);

        const concatted = concatAll<R>()(of(initial, onGoing));

        return behaviourSubjectFromSubscribable(concatted, null as any);
    }
}
