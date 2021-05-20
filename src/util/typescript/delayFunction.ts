/**
 * Creates a delayed version of the function which only calls the
 * base function if it is not called within a certain period. Useful
 * for not performing a network request until the user takes a break from
 * editing a resource.
 *
 * @param func
 *          The function to call.
 * @param delayMS
 *          The minimum amount of time to wait between calls to the
 *          returned function before calling the base function.
 * @return
 *          The delayed equivalent of the given function.
 */
export default function delayFunction<P extends readonly unknown[]>(
    func: (...args: P) => void,
    delayMS: number
): (...args: P) => void {
    let timeout: number | undefined = undefined

    return (...args) => {
        if (timeout !== undefined) clearTimeout(timeout)

        timeout = setTimeout(func, delayMS, ...args)
    }
}