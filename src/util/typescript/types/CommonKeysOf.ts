export type CommonKeysOf<A extends {}, B extends {}> = keyof A & keyof B

export function commonKeysOf<A extends {}, B extends {}>(
    a: A,
    b: B
): CommonKeysOf<A, B>[] {
    const result: CommonKeysOf<A, B>[] = [];
    for (const key in a) {
        if (!a.hasOwnProperty(key)) continue;
        if (!b.hasOwnProperty(key)) continue;
        result.push((key as unknown) as CommonKeysOf<A, B>)
    }
    return result;
}