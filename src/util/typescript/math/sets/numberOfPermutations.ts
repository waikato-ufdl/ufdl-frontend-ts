import numberOfSubsets from "./numberOfSubsets";

/**
 * Calculates the number of possible permutations of a collection
 * of the given [size].
 *
 * @param size
 *          The number of items in the collection.
 * @return
 *          The number of possible permutations of a collection
            of the given [size].
 */
export default function numberOfPermutations(
    size: bigint
) {
    return numberOfSubsets(size, size, true)
}
