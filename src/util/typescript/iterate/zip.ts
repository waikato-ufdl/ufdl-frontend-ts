import {any} from "../any";
import {isReturnResult} from "./result";
import {IteratedType} from "../types/iterate/IteratedType";
import NOT_IMPLEMENTED from "../error/NOT_IMPLEMENTED";
import {SelfIterableIterator} from "./SelfIterableIterator";
import asIterable from "./asIterable";


export type ZiperatedType<T extends readonly Iterable<unknown>[]>
    = { [K in keyof T]: T[K] extends Iterable<unknown> ? IteratedType<T[K]> : T[K]}

type ZipIteratorsType<T extends readonly Iterable<unknown>[]>
    = { [K in keyof T]: T[K] extends Iterable<unknown> ? Iterator<IteratedType<T[K]>> : T[K] }

export default function zip<T extends readonly Iterable<unknown>[]>(
    ...iterables: T
): SelfIterableIterator<ZiperatedType<T>> {
    const iterators: ZipIteratorsType<T> = iterables.map((iterable) => iterable[Symbol.iterator]()) as any
    return asIterable({
        next(args: any): IteratorResult<ZiperatedType<T>> {
            const results: { [K in keyof T]: IteratorResult<T[K]> } = iterators.map((iterator) => iterator.next(args)) as any
            if (any(isReturnResult, ...results)) {
                return {
                    done: true,
                    value: undefined
                }
            } else {
                return {
                    done: false,
                    value: results.map((value) => value.value) as any
                }
            }
        },
        return(_value: any): IteratorResult<ZiperatedType<T>> {
            NOT_IMPLEMENTED()
        },
        throw(_e: any): IteratorResult<ZiperatedType<T>> {
            NOT_IMPLEMENTED()
        }
    })
}