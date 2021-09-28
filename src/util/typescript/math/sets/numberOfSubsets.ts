/**
 * Gets the number of ways to choose [subsetSize] items from a set of
 * [setSize] possibilities.
 *
 * @param setSize
 *          The number of items to select from.
 * @param subsetSize
 *          The number of items to select.
 * @param orderMatters
 *          Whether selections of the same items but in a different selection-order
 *          are considered distinct subsets.
 * @param canReselect
 *          Whether the same item can appear more than once in a subset.
 * @return
 *          The number of possible subsets that could be selected.
 */
import {BIG_INT_ONE, BIG_INT_ZERO} from "../../bigint/constants";
import factorial from "../factorial";
import exponent from "../../bigint/exponent";

export default function numberOfSubsets(
    setSize: bigint,
    subsetSize: bigint,
    orderMatters: boolean = false,
    canReselect: boolean = false
): bigint {
    // Sets can't have negative size
    if (setSize < BIG_INT_ZERO)
        throw new Error(`Can't have a set of ${setSize} items`)
    if (subsetSize < BIG_INT_ZERO)
        throw new Error(`Can't have a subset of ${subsetSize} items`)

    // Can only ever select 1 subset of size zero, the empty set
    if (subsetSize === BIG_INT_ZERO)
        return BIG_INT_ONE

    // If there are no items to select from, the empty set is the only possible selection,
    // so any subsets of greater size are impossible
    if (setSize === BIG_INT_ZERO)
        return BIG_INT_ZERO

    // Handle reselection separately
    if (canReselect) {
        // If order matters, (n, k) = n^k
        if (orderMatters)
            return exponent(setSize, subsetSize)

        // Otherwise, (n, k) = (n + k - 1, k) (without reselection). Rather than recursing, we
        // just fall through with a modified n
        setSize += subsetSize - BIG_INT_ONE

    } else {
        // Without reselection, we can't select more items than are in the set
        if (subsetSize > setSize)
            return BIG_INT_ZERO
    }

    // If order matters, (n, k) = n! / (n - k)! (without reselection)
    if (orderMatters)
        return factorial(setSize, setSize - subsetSize)

    // Otherwise, (n, k) = n! / k!(n - k)! (again, without reselection).
    // We discriminate on the difference between n and k to determine
    // the least number of multiplications to perform
    const remainderSize = setSize - subsetSize
    if (subsetSize > remainderSize)
        return factorial(setSize, subsetSize) / factorial(remainderSize)
    else
        return factorial(setSize, remainderSize) / factorial(subsetSize)
}
