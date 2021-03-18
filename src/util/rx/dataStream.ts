import {BehaviorSubject} from "rxjs";
import {observableReadableStream} from "./readableStream";
import {concatUint8Array} from "../concatUint8Array";
import behaviourSubjectOperatorFunction from "./behaviourSubjectOperatorFunction";
import {scan} from "rxjs/operators";
import behaviourSubjectFromSubscribable from "./behaviourSubjectFromSubscribable";

/*
 * Functionality for using a progressive download of data in RX.
 */

/** A readable stream of data. */
export type DataStream = ReadableStream<Uint8Array>

/** A download progression of data. */
export type DataStreamSubject = BehaviorSubject<Uint8Array>

/**
 * Progressively buffers data from a data stream as a behaviour subject.
 *
 * @param dataStream
 *          The data stream to buffer.
 * @return
 *          A behaviour subject representing the amount of data downloaded so far.
 */
export function dataStreamSubject(
    dataStream: DataStream
): DataStreamSubject {
    // Create an operator function that accumulates data for a behaviour subject
    const dataAccumulator = behaviourSubjectOperatorFunction(
        scan(
            (acc: Uint8Array, value: Uint8Array) => concatUint8Array(acc, value)
        )
    );

    // Create a behaviour subject that observes the data stream
    const dataSubject = behaviourSubjectFromSubscribable(
        observableReadableStream(dataStream),
        new Uint8Array()
    );

    // Make the subject accumulate (buffer) the data
    return dataAccumulator(dataSubject);
}
