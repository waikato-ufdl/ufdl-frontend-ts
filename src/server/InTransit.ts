import {BehaviorSubject, Observable} from "rxjs"
import behaviourSubjectOperatorFunction from "../util/rx/behaviourSubjectOperatorFunction";
import {map} from "rxjs/operators";
import {memo} from "../util/memo";


export class InTransit<T> {

    private constructor(
        readonly getValue: () => T,
        readonly getObservable: () => Observable<T>
    ) {
    }

    static fromPlain<T>(value: T): InTransit<T> {
        return new InTransit(
            () => value,
            memo(() => new BehaviorSubject(value))
        )
    }

    static fromBehaviourSubject<T>(value: BehaviorSubject<T>): InTransit<T> {
        return new InTransit(
            () => value.getValue(),
            () => value
        )
    }

    map<R>(
        f: (value: T) => R
    ): InTransit<R> {
        return new InTransit(
            () => f(this.getValue()),
            memo(() => behaviourSubjectOperatorFunction(map(f))(this.getObservable() as BehaviorSubject<T>))
        )
    }


}
