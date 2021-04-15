/** Symbol identifying that the promise-stream has finished producing values. */
export const PROMISE_STREAM_COMPLETED = Symbol("No more values are coming from this stream");

/** A stream of values delivered in the form of sequential promises. */
export type PromiseStream<T> = Promise<typeof PROMISE_STREAM_COMPLETED | [T, PromiseStream<T>]>
