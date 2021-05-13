/** Type of a predicate on a value. */
export type Predicate<T> = (value: T) => boolean

export function not<T>(predicate: Predicate<T>): Predicate<T> {
    return (value) => !predicate(value)
}

export function and<T>(...predicates: Predicate<T>[]): Predicate<T> {
    return (value) => {
        for (const predicate of predicates) if (!predicate(value)) return false;
        return true;
    }
}

export function or<T>(...predicates: Predicate<T>[]): Predicate<T> {
    return (value) => {
        for (const predicate of predicates) if (predicate(value)) return true;
        return false;
    }
}
