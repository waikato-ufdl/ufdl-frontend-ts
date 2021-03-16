import {discard} from "../discard";

export default class TaskQueue {
    private _queue: Promise<void> = Promise.resolve();
    private _lastEnqueued: bigint = BigInt(0);
    private _lastCompleted: bigint = BigInt(0);

    enqueue(
        task: () => Promise<void>,
        onError: (e: any) => Promise<void> = async () => {}
    ): void {
        const ticket = this._lastEnqueued + BigInt(1);

        this._lastEnqueued = ticket;

        const handler = async () => {
            try {
                await task()
            } catch (e) {
                discard(onError(e)); // Don't await otherwise we'll wear errors coming from the error handler
            }
            this._lastCompleted = ticket;
        };

        this._queue = this._queue.then(handler);
    }

    get remainingTasks(): bigint { return this._lastEnqueued - this._lastCompleted; }

    get idle(): boolean { return this._lastEnqueued === this._lastCompleted; }

}