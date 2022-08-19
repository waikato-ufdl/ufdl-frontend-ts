export function inferElementsFromFirst<A, B>(
    array: readonly [A, ...A[]] | readonly [B, ...B[]],
    test: (first: A | B) => first is A
): array is readonly [A, ...A[]] {
    return test(array[0])
}
