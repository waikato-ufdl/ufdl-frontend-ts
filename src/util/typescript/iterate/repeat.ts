import {SelfIterableIterator} from "./SelfIterableIterator";
import NOT_IMPLEMENTED from "../error/NOT_IMPLEMENTED";

export default function repeat<T>(
    value: T,
    times: number | undefined = undefined
): SelfIterableIterator<T> {
    return {
        next(): IteratorResult<T> {
            if (times === undefined || times > 0) {
                if (times !== undefined) times--
                return { value: value }
            } else {
                return {
                    done: true,
                    value: undefined
                }
            }
        },
        return(): IteratorResult<T> {
            NOT_IMPLEMENTED()
        },
        throw(): IteratorResult<T> {
            NOT_IMPLEMENTED()
        },
        [Symbol.iterator]() {
            return this;
        }

    }
}