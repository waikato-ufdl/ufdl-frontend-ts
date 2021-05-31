import {PRNG} from "./PRNG";

/** Constant offset used to turn a signed 32-bit into its unsigned counterpart. */
const INT32_MIN_VALUE = -(2^31)

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
