import {PRNG} from "./PRNG";
import isPowerOfTwo from "../bigint/isPowerOfTwo";
import bitLength from "../bigint/bitLength";
import randomBits from "./randomBits";
import {BIG_INT_ONE, BIG_INT_ZERO} from "../bigint/constants";

/** Constant used in bit-shifting 32-bit unsigned integers into a big-int. */
const BIG_INT_32 = BigInt(32)

/**
 * Gets a randomly-generated big integer in the range [from, to).
 *
 * @param prng
 *          The source of randomness.
 * @param to
 *          The exclusive upper-bound to generate.
 * @param from
 *          The inclusive lower-bound to generate.
 */
export default function randomBigInt(
    prng: PRNG,
    to: bigint,
    from: bigint = BIG_INT_ZERO
): bigint {
    // If from is non-zero, get a number of the size of the range [from, to]
    // and add it to from.
    if (from !== BIG_INT_ZERO)
        return randomBigInt(prng, to - from) + from

    // If to is negative, make it positive and return the negative of the result
    if (to < from)
        return -randomBigInt(prng, -to)

    // If the range is zero-width, return the single possible value
    if (to === BIG_INT_ZERO)
        return to

    // If to is not a power of 2, keep generating numbers less than the
    // next biggest power of 2 until one is less than to
    if (!isPowerOfTwo(to)) {
        const upperBound = BIG_INT_ONE << BigInt(bitLength(to))
        while (true) {
            const next = randomBigInt(prng, upperBound)
            if (next < to) return next
        }
    }

    // Generate random bits up to the required bit length
    const randBits = randomBits(prng, bitLength(to) - 1)

    // Concatenate the bits into a big-int
    let result = BIG_INT_ZERO
    for (const bits of randBits) {
        result <<= BIG_INT_32
        result += BigInt(bits)
    }

    return result
}
