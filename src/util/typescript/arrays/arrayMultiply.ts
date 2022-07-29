import range from "../range";

export default function arrayMultiply<T>(
    array: T[],
    multiplier: number
): T[] {
    const result: T[] = []
    for (const _ of range(multiplier)) {
        result.push(...array)
    }
    return result
}
