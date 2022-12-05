import {ImageAnnotation, VideoAnnotation} from "ufdl-ts-client/json/hand_crafted/AnnotationsFile";

/** The type of annotation for image object-detection tasks. */
export type DetectedObjects = [ImageAnnotation, ...ImageAnnotation[]] | [VideoAnnotation, ...VideoAnnotation[]]