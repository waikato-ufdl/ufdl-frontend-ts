import {Observable, PartialObserver} from "rxjs";
import {discard} from "../typescript/discard";

/**
 * Creates an Observable which observes values from a ReadableStream.
 *
 * @param stream
 *          The stream to observe.
 * @return
 *          The Observable view of the stream.
 */
export function observableReadableStream<T>(
    stream: ReadableStream<T>
): Observable<T> {
    return new Observable(
        (subscriber) => {
            discard(observeReadableStream(stream, subscriber));
        }
    )
}

/**
 * Calls the lifecycle methods of the observer based on information
 * coming from a readable stream.
 *
 * @param stream
 *          The stream to observe.
 * @param observer
 *          The observer.
 * @return
 *          A promise of completion of the stream.
 */
export async function observeReadableStream<T>(
    stream: ReadableStream<T>,
    observer: PartialObserver<T>
): Promise<void> {
    const reader = stream.getReader();

    while (true) {
        const {value, done} = await reader.read();

        if (done || value === undefined) break;

        if (observer.next !== undefined) observer.next(value);
    }

    if (observer.complete !== undefined) observer.complete();
}
