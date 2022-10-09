import {PRNG} from "./PRNG";

/**
 * Constant offset used to turn a signed 32-bit into its unsigned counterpart.
 *
 * Hard-coded as Javascript does some strange conversions around calculating this value.
 * You would think it's -(1 << 31) but the (1 << 31) part is seemingly done in a 32-bit field
 * which then overflows to the below value. However when it then applies the negation, this
 * must be implicitly converted to a greater-than-32-bit field (perhaps the 53-bit double
 * significand?) because the result is +2,147,483,648, which is not normally representable in
 * signed two's-complement 32-bit integers.
 */
const INT32_MIN_VALUE = -2_147_483_648

/**
 * Generates a random unsigned 32-bit integer.
 *
 * @param prng
 *          The source of randomness.
 */
export default function randomUint32(
    prng: PRNG
): number {
    return prng.int32() - INT32_MIN_VALUE
}
