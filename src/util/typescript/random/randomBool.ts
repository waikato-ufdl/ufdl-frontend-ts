import {PRNG} from "./PRNG";

/**
 * Gets a randomly generated boolean value from a PRNG.
 *
 * @param prng
 *          The random number generator.
 * @return
 *          Either true or false with equal probability.
 */
export default function randomBool(
    prng: PRNG
): boolean {
    return prng.int32() < 0
}
