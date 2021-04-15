import {discard} from "../discard";

/**
 * Ensures that an async routine cannot be awaited (returns immediately
 * if await is used).
 *
 * @param body
 *          The async routine.
 */
export function unawaitable<B extends (...args: any) => Promise<void>>(
    body: B
): B {
    return (
        async (...args: any) => {
            discard(body(...args));
        }
    ) as B;
}
