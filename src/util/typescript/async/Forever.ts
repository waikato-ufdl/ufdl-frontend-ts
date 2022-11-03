/**
 * Awaitable promise that will never resolve/reject.
 */
export const Forever: Promise<never> = (
    new Promise(() => {})
);
