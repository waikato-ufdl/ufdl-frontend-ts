import {BehaviorSubject} from "rxjs";

export default function isBehaviourSubject(
    value: any
): value is BehaviorSubject<any> {
    return value instanceof BehaviorSubject;
}
