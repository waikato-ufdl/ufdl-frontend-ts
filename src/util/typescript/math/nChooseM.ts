import factorial from "./factorial";

/**
 * Gets the number of ways to select [m] items from a pool
 * of [n] possibilities.
 *
 * @param n
 *          The number of possible items to select from.
 * @param m
 *          The number of items to select.
 * @param orderMatters
 *          Whether the order of selection is important.
 * @return
 *          The number of possible selections.
 */
export default function nChooseM(
    n: bigint | number,
    m: bigint | number,
    orderMatters: boolean = false
): bigint {
    // Cast the inputs to integers
    n = BigInt(n)
    m = BigInt(m)

    // Simple cases
    if (m > n || m < 0) return BigInt(0)
    if (m === n || m === BigInt(0)) return BigInt(1)

    // Required for either calculation
    const nMinusM = n - m

    // (n, m) = n! / (m! * (n - m)!)

    // If order matters, m! comes out of the denominator
    if (orderMatters)
        return factorial(n, nMinusM)

    return m > nMinusM
        ? factorial(n, m) / factorial(nMinusM)
        : factorial(n, nMinusM) / factorial(m)
}
