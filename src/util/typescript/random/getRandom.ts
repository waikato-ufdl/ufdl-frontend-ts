import seedrandom from "seedrandom";
import {PRNG} from "./PRNG";

/**
 * Gets a new pseudo-random number generator, optionally seeded
 * with the given value.
 *
 * @param seed
 *          The seed value to use.
 * @return
 *          A pseudo-random number generator.
 */
export default function getRandom(
    seed?: string
): PRNG {
    return seedrandom(seed)
}
