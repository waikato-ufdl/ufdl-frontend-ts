import bitLength from "./bitLength";
import {BIG_INT_ONE} from "./constants";

/**
 * Gets the index of the lowest-order bit in the binary representation
 * of n that is a 1.
 *
 * @param n
 *          The big integer to test.
 * @return
 *          The bit-index of the lowest-order set bit in n.
 */
export default function lowestSetBit(
    n: bigint
): number {
    // TODO: Take 2's complement when n is negative
    if (n < 1)
        throw new Error(
            `Can't currently find lowest set bit of non-positive numbers, got ${n}`
        )

    return bitLength(n & ~(n - BIG_INT_ONE)) - 1
}
