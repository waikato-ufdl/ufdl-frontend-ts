export default function arrayMap<
    TArray extends readonly unknown[],
    TReturn
>(
    array: TArray,
    mapFn: (element: TArray[number], index: number) => TReturn
): { [TKey in keyof TArray]: TKey extends number ? TReturn : TKey extends keyof [] ? TArray[TKey] : never } {
    return array.map(mapFn as any) as any
}
