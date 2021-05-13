export function anyToString(
    value: any
): string {
    if (value === undefined || value === null)
        return `${value}`
    else
        return value.toString()
}
