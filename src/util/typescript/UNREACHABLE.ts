export default function UNREACHABLE(
    reason?: string
): never {
    throw new Error(
        `Reached unreachable code: this should not have occurred\n${reason}`
    )
}
