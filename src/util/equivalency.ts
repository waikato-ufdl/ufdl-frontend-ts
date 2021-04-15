export type Equivalency<T> = (a: T, b: T) => boolean

export type Equivalencies<T extends object> = {
    [K in keyof T]-?: Equivalency<T[K]>
}

export function alwaysEquivalent(_a: unknown, _b: unknown): true {
    return true;
}

export function neverEquivalent(_a: unknown, _b: unknown): false {
    return false;
}

export function areEquivalent<T extends object>(a: T, b: T, e: Equivalencies<T>) {
    for (const key in e) {
        const equivalency = e[key];
        if (!equivalency(a[key], b[key])) return false;
    }

    return true;
}

export function isShallowEqual<T extends object>(a: T, b: T, ...keys: (keyof T)[]): boolean {
    if (keys.length === 0) keys = Object.keys(a) as (keyof T)[];

    for (const key in a) {
        if (keys.length > 0 && !keys.includes(key)) continue;
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}

export function isDeepEqual<T>(a: T, b: T): boolean {
    if (!(a instanceof Object) || !(b instanceof Object)) return a === b;

    for (const key in a) {
        if (!isDeepEqual(a[key], b[key])) {
            return false;
        }
    }
    return true;
}