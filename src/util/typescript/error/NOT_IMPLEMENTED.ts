export default function NOT_IMPLEMENTED(
    reason?: string
): never {
    if (reason === undefined)
        reason = `Not implemented`
    else
        reason = `Not implemented: ${reason}`

    throw new Error(reason)
}
