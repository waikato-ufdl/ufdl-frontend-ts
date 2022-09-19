/*
 * Types of annotations.
 */
import {ImageAnnotation, VideoAnnotation} from "ufdl-ts-client/json/hand_crafted/AnnotationsFile";

/** Symbol representing the case when a dataset item is not annotated. */
export const NO_ANNOTATION: unique symbol = Symbol("The dataset item is not annotated")

/** Type representing either annotations or no annotations. */
export type OptionalAnnotations<A> = A | typeof NO_ANNOTATION

/** The type of annotation for classification tasks. */
export type Classification = string

/** The type of annotation for image object-detection tasks. */
export type DetectedObjects = [ImageAnnotation, ...ImageAnnotation[]] | [VideoAnnotation, ...VideoAnnotation[]]

/** The type of annotation for speech tasks. */
export type Transcription = string
