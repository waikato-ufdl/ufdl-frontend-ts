import {BIG_INT_ONE} from "./constants";

/**
 * Raises a [BigInteger] to the power of another [BigInteger].
 *
 * @param base
 *          The big integer to raise.
 * @param exponent
 *          The exponent to raise [base] to.
 * @return
 *          The [base] raised to the [exponent] power.
 */
export default function exponent(
    base: bigint,
    exponent: bigint
): bigint {
    // Can't raise to a negative power
    if (exponent < 0)
        throw new Error(
            `Can't raise to negative exponents, got ${exponent}`
        )

    let result = BIG_INT_ONE
    while (exponent > 0) {
        result *= base
        exponent -= BIG_INT_ONE
    }

    return result
}
