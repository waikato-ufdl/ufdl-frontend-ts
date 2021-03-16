export function ifExpr<T, F>(
    condition: boolean,
    trueOutcome: () => T,
    falseOutcome: () => F
): T | F {
    if (condition) {
        return trueOutcome();
    } else {
        return falseOutcome();
    }
}
