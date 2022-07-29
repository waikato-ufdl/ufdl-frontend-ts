import isDefined, {Defined} from "./isDefined";

export default function ifDefined<V, T, F>(
    value: Defined<V>,
    onDefined: (value: Defined<V>) => T,
    onUndefined: () => F
): T

export default function ifDefined<V, T, F>(
    value: undefined,
    onDefined: (value: Defined<V>) => T,
    onUndefined: () => F
): F

export default function ifDefined<V, T, F>(
    value: V | undefined,
    onDefined: (value: Defined<V>) => T,
    onUndefined: () => F
): T | F

export default function ifDefined<V, T, F>(
    value: V | undefined,
    onDefined: (value: Defined<V>) => T,
    onUndefined: () => F
): T | F {
    if (isDefined(value))
        return onDefined(value)

    return onUndefined()
}
