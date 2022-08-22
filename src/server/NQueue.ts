import range from "../util/typescript/range";
import iteratorMap from "../util/typescript/iterate/map";
import iterate from "../util/typescript/iterate/iterate";
import Scheduler from "ufdl-ts-client/schedule/Scheduler";

export class NQueue implements Scheduler {

    private readonly queues: Array<readonly [Promise<number>, boolean]>

    constructor(n: number) {
        this.queues = [...iteratorMap(
            iterate(range(n)),
            i => [Promise.resolve(i), true] as const)
        ]
    }

    schedule<R>(f: () => Promise<R>): Promise<R> {
        return this.wrapped(f)()
    }

    private wrapped<R>(
        f: () => Promise<R>
    ): () => Promise<R> {
        return async () => {
            const queues = this.queues

            for (;;) {
                const nextQueue = await Promise.race(queues.map(el => el[0]))
                const ready = queues[nextQueue][1]
                if (ready) {
                    const scheduled = f()

                    queues[nextQueue] = [
                        scheduled.then(() => {
                            queues[nextQueue] = [queues[nextQueue][0], true] as const
                            return nextQueue
                        }),
                        false
                    ] as const

                    return await scheduled
                }
            }
        }

    }

}