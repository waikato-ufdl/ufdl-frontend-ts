/*
 * Types of annotations.
 */
import {Annotation} from "ufdl-ts-client/json/generated/Image";

/** Symbol which represents no classification label for a dataset item. */
export const NO_CLASSIFICATION = Symbol("The dataset entry has no classification.")

/** The type of annotation for classification tasks. */
export type Classification = string | typeof NO_CLASSIFICATION

/** The type of annotation for image object-detection tasks. */
export type DetectedObjects = Annotation[]
