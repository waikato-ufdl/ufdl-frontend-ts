import getRandom from "./getRandom";
import numberOfSubsets from "../math/sets/numberOfSubsets";
import randomBigInt from "./randomBigInt";
import subsetNumberToSubset from "../math/sets/subsetNumberToSubset";
import {PRNG} from "./PRNG";

/**
 * Returns a random subset of the given [set].
 *
 * @param set
 *          The set of items to select from.
 * @param subsetSize
 *          The number of items to select.
 * @param orderMatters
 *          Whether the order of the selected items is important.
 * @param canReselect
 *          Whether items can be reselected.
 * @param prng
 *          An optional source of randomness or seed value.
 * @return
 *          An array containing the selected items from the original [set].
 */
export default function randomSubset<T>(
    set: T[],
    subsetSize: bigint,
    orderMatters: boolean = false,
    canReselect: boolean = false,
    prng?: PRNG | string
): T[] {
    const setSize = BigInt(set.length)
    if (prng === undefined || typeof prng === "string")
        prng = getRandom(prng)
    const numChoices = numberOfSubsets(setSize, subsetSize, orderMatters, canReselect)
    const choice = randomBigInt(prng, numChoices)
    const indices = subsetNumberToSubset(setSize, subsetSize, choice, orderMatters, canReselect)
    return indices.map((index) => set[Number(index)])
}
