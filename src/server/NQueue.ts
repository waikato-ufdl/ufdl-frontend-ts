import Scheduler from "ufdl-ts-client/schedule/Scheduler";
import {rendezvous} from "../util/typescript/async/rendezvous";
import {discard} from "../util/typescript/discard";

export class NQueue implements Scheduler {

    private readonly queue: (() => Promise<void>)[]
    private readonly inFlight: (Promise<unknown> | undefined)[]

    constructor(private readonly n: number) {
        this.inFlight = Array(n).fill(undefined)
        this.queue = []
    }

    schedule<R>(f: () => Promise<R>): Promise<R> {
        if (this.queue.length === 0) {
            const freeSlot = this.inFlight.indexOf(undefined)
            if (freeSlot !== -1) return this.scheduleImmediate(f, freeSlot)
        }

        const [promise, resolve, reject] = rendezvous<R>()

        const wrapped = () => f().then(resolve, reject)

        this.queue.push(wrapped)

        return promise
    }

    private scheduleImmediate<R>(
        f: () => Promise<R>,
        position: number
    ): Promise<R> {

        const promise = f()

        promise.finally(
            () => {
                const next = this.queue.shift()

                if (next !== undefined) {
                    discard(this.scheduleImmediate(next, position))
                } else {
                    this.inFlight[position] = undefined
                }
            }
        )

        this.inFlight[position] = promise

        return promise

    }
}
