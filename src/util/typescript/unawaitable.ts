import {discard} from "../discard";

/**
 * Ensures that if an async routine is awaited, that it returns immediately.
 *
 * @param body
 *          The async routine.
 */
export function unawaitable(
    body: () => Promise<void>
): () => Promise<void> {
    return async () => {
        discard(body());
    }
}
