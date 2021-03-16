import {BehaviorSubject} from "rxjs";
import {observableReadableStream} from "./readableStream";
import {concatUint8Array} from "../concatUint8Array";
import behaviourSubjectOperatorFunction from "./behaviourSubjectOperatorFunction";
import {scan} from "rxjs/operators";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";

export type DataStream = ReadableStream<Uint8Array>

export type DataStreamSubject = BehaviorSubject<Uint8Array>

export function dataStreamSubject(
    dataStream: DataStream
): DataStreamSubject {
    return behaviourSubjectOperatorFunction(
        scan(
            (acc: Uint8Array, value: Uint8Array) => concatUint8Array(acc, value)
        )
    )(
        behaviourSubjectFromSubscribable(
            observableReadableStream(dataStream),
            new Uint8Array()
        )
    )
}
