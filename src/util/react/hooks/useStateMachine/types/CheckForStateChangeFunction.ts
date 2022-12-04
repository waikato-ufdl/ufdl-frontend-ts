/**
 * The type of function that an automatic state transition can use
 * to detect if the state has already changed from when it was
 * initiated, allowing for a possible early-exit.
 *
 * @param suppress
 *          Whether to return the changed-state in-band (as a boolean), or
 *          out-of-band (by throwing {@link STATE_CHANGED}.
 * @return
 *          A promise of whether the state has changed (if suppress is true) or
 *          a void promise if suppress is false.
 */
export type CheckForStateChangeFunction = ((suppress?: false) => Promise<void>) & ((suppress: true) => Promise<boolean>)
