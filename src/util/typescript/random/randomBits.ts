import {PRNG} from "./PRNG";
import randomUint32 from "./randomUint32";

/**
 * Generates random binary data.
 *
 * @param prng
 *          The source of randomness.
 * @param numBits
 *          The number of bits of data to generate.
 * @return
 *          An array of bits packed into 32-bit unsigned integers.
 *          If [numBits] is not an even multiple of 32, the 0-index
 *          int has the remainder of the bits.
 */
export default function randomBits(
    prng: PRNG,
    numBits: number
): Uint32Array {
    // Create a buffer to store the randomly generated number
    const res: number[] = []

    // Find out how many extra bits are needed (over a multiple of 32)
    const remainder = numBits % 32

    // Generate the remainder bits first (if needed)
    if (remainder !== 0) {
        res.push(randomUint32(prng) % (1 << remainder))
        numBits -= remainder
    }

    // Generate all other bits
    while (numBits > 0) {
        res.push(randomUint32(prng))
        numBits -= 32
    }

    return Uint32Array.from(res)
}
