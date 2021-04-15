/**
 * Awaitable promise that will never resolve/reject.
 */
export const Forever: Promise<void> = (
    new Promise(() => {})
);
