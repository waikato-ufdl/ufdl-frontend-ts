import {Absent, Possible} from "../types/Possible";

export function first<T>(
    iterable: Iterable<T>
): Possible<T> {
    for (const element of iterable) return element
    return Absent
}
