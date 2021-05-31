import {BIG_INT_ZERO} from "./constants";

/**
 * Gets the number of bits used to represent the given integer
 * in binary.
 *
 * @param n
 *          The big integer to test.
 * @return
 *          The number of bits in the binary representation of n.
 */
export default function bitLength(
    n: bigint
): number {
    // TODO: Take 2's complement when n is negative
    if (n < 0)
        throw new Error(
            `Can't currently find bit length of negative numbers, got ${n}`
        )

    // Zero should return 0, not the true representation length of 1
    if (n === BIG_INT_ZERO) return 0

    return n.toString(2).length
}
