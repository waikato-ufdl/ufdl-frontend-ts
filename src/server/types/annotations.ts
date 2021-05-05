/*
 * Types of annotations.
 */

/** Symbol which represents no classification label for a dataset item. */
export const NO_CLASSIFICATION = Symbol("The dataset entry has no classification.")

/** The type of annotation for classification tasks. */
export type Classification = string | typeof NO_CLASSIFICATION
