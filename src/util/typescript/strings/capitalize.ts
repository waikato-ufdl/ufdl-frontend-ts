export default function capitalize<S extends string>(
    str: S
): Capitalize<S> {
    if (str.length === 0) return str as any
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}` as any
}