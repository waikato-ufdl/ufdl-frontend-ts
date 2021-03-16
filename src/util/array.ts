export function isArrayTyped<E>(value: E[] | any): value is E[] {
    return value instanceof Array;
}

export function spreadJoinArrays<E>(...elements: E[]): E[] {
    return elements;
}

export function arrayShallowEqual(a: readonly any[], b: readonly any[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export function indexInBounds(array: readonly any[], index: number): boolean {
    return 0 <= index && index < array.length;
}