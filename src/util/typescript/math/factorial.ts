import {BIG_INT_ONE, BIG_INT_ZERO} from "../bigint/constants";

/**
 * Returns the multiplication of all positive integers from [of]
 * down to (but not including) [downTo].
 *
 * @param of
 *          The greatest positive integer to include in the product.
 * @param downTo
 *          The greatest positive integer, less than [of], to exclude
 *          from the product.
 * @return
 *          The factorial of [of] down to [downTo]. If [of] equals
 *          [downTo], the result is [of].
 */
export default function factorial(
    of: bigint,
    downTo: bigint = BigInt(1)
): bigint {
    // Check pre-conditions
    if (downTo < BIG_INT_ZERO)
        throw new Error(`'downTo' cannot be less than 0, got ${downTo}`)
    if (of < downTo)
        throw new Error(`'of' must be at least 'downTo', got 'downTo' = ${downTo}, 'of' = ${of}`)

    // Perform the reduction
    let result = BIG_INT_ONE
    while (of > downTo) {
        result *= of
        of -= BIG_INT_ONE
    }

    return result
}
