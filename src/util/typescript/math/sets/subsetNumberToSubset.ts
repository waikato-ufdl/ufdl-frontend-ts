import {BIG_INT_MINUS_ONE, BIG_INT_ONE, BIG_INT_ZERO} from "../../bigint/constants";
import range from "../../range";
import numberOfSubsets from "./numberOfSubsets";

/**
 * Decodes a number into a unique subset.
 *
 * @param setSize
 *          The number of items to select from.
 * @param subsetSize
 *          The number of items to select.
 * @param subsetNumber
 *          A number in [0, [numberOfSubsets]) given the same
 *          arguments as this function.
 * @param orderMatters
 *          Whether selections of the same items but in a different selection-order
 *          are considered distinct subsets.
 * @param canReselect
 *          Whether the same item can appear more than once in a subset.
 * @return
 *          An array of item indices comprising the subset.
 */
export default function subsetNumberToSubset(
    setSize: bigint,
    subsetSize: bigint,
    subsetNumber: bigint,
    orderMatters: boolean = false,
    canReselect: boolean = false
): bigint[] {
    // Sets can't have negative size
    if (setSize < 0)
        throw new Error(`Can't have a set of ${setSize} items`)
    if (subsetSize < 0)
        throw new Error(`Can't have a subset of ${subsetSize} items`)

    // Subset size must be representable by a number for a valid array size
    if (subsetSize > Number.MAX_SAFE_INTEGER)
        throw new Error(`Can't fit ${subsetSize} items in an array`)
    let subsetSizeAsNumber: number = Number(subsetSize)

    // Start with the empty set
    let subset: bigint[] = []

    // The empty set is the only possible subset of size 0, so return it
    if (subsetSize === BIG_INT_ZERO) {
        // Subset number should be 0 for a subset size of 0
        if (subsetNumber !== BIG_INT_ZERO)
            throw new Error(
                `0 is the only valid subset number for subsets of size 0, got ${subsetNumber}`
            )

        return subset
    }

    // If there are no items to select from, the empty set is the only possible selection,
    // so any subsets of greater size are impossible
    if (setSize === BIG_INT_ZERO) {
        throw new Error(
            `Can't select a non-empty subset (subset size = ${subsetSize}) from the empty set`
        )
    }

    // Special case for order-dependent
    if (orderMatters) {
        // Ordered with reselection is shift-encoded, so simply shift-decode
        if (canReselect) {
            while (subset.length < subsetSize) {
                subset = subset.concat(subsetNumber % setSize)
                subsetNumber /= setSize
            }

        // Without reselection, the items available for selection reduces by 1 at each iteration
        } else {
            let factor = setSize - subsetSize + BIG_INT_ONE
            while (subset.length < subsetSize) {
                let next = subsetNumber % factor
                subsetNumber /= factor
                for (const index in subset) {
                    if (subset[index] >= next)
                        subset[index] += BIG_INT_ONE
                }
                subset = [BIG_INT_ZERO].concat(subset)
                factor += BIG_INT_ONE
            }
        }

        return subset
    }

    // If reselect is allowed, we are expecting the equivalent binomial representation of the selection
    if (canReselect) {
        setSize += subsetSize - BIG_INT_ONE
        subsetSize = setSize - subsetSize
        if (subsetSize > Number.MAX_SAFE_INTEGER)
            throw new Error(`Can't fit ${subsetSize} items in an array`)
        subsetSizeAsNumber = Number(subsetSize)
    }

    // Decode the arithmetic encoding of the binomial representation
    let numSubsets = numberOfSubsets(
        setSize - BIG_INT_ONE,
        subsetSize
    )
    let k = subsetSize
    for (const n of range(setSize).reversed()) {
        if (subsetNumber >= numSubsets) {
            subsetNumber -= numSubsets
            subset = subset.concat(n)
            if (subset.length === subsetSizeAsNumber) break
            numSubsets = numSubsets * k / n
            k -= BIG_INT_ONE
        } else if (n > 0) {
            numSubsets = numSubsets * (n - k) / n
        }
    }

    // Convert the binomial representation back to the original multinomial one if reselection was enabled
    if (canReselect) {
        subset.sort()
        subsetSize = setSize - subsetSize
        setSize -= subsetSize - BIG_INT_ONE
        const setSizeAsNumber = Number(setSize)
        const counts = new Map<number, bigint>()
        let total = BIG_INT_ZERO
        for (const i of range(setSizeAsNumber - 1)) {
            const last = i === 0 ? BIG_INT_MINUS_ONE : subset[i - 1]
            const count = subset[i] - last - BIG_INT_ONE
            total += count
            if (count !== BIG_INT_ZERO) {
                counts.set(i, count)
            }
        }
        if (total < subsetSize)
            counts.set(setSizeAsNumber - 1, subsetSize - total)
        subset = []
        for (const [value, count] of counts.entries()) {
            for (const _ of range(count))
                subset.concat(BigInt(value))
        }
    }

    return subset
}