/**
 * Returns the multiplication of all positive integers from [n]
 * down to (but not including) [m].
 *
 * @param n
 *          The factorial upper bound.
 * @param m
 *          The factorial (exclusive) lower bound.
 * @return
 *          The factorial of [n] down to [m].
 */
export default function factorial(
    n: bigint | number,
    m: bigint | number = BigInt(1)
): bigint {
    // Cast inputs to integers
    n = BigInt(n)
    m = BigInt(m)

    // Check pre-conditions
    if (m < 1) throw new Error(`m cannot be less than 1, got ${m}`)
    if (n <= m) throw new Error(`n must be greater than m, got m = ${m}, n = ${n}`)

    // Perform the reduction
    let result = n
    n -= BigInt(1)
    while (n > m) {
        result *= n
        n -= BigInt(1)
    }

    return result
}