import seedrandom from "seedrandom";

/** The type of a pseudo-random number generator. */
export type PRNG = ReturnType<typeof seedrandom>
