import {BIG_INT_ONE, BIG_INT_ZERO} from "./constants";

/**
 * Whether the given integer is a power of 2.
 *
 * @param n
 *          The big integer to test.
 * @return
 *          Whether n is a power of 2.
 */
export default function isPowerOfTwo(
    n: bigint
): boolean {
    // One is the smallest integer power of 2
    if (n < 1) return false

    // True if only a single bit is set
    return (n & (n - BIG_INT_ONE)) === BIG_INT_ZERO
}
