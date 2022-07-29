import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import * as ISDataset from "ufdl-ts-client/functional/image_segmentation/dataset";
import * as SPDataset from "ufdl-ts-client/functional/speech/dataset";
import {Data, Image, ImageOrVideo} from "./types/data";
import {Classification, DetectedObjects} from "./types/annotations";
import {ownPropertyIterator} from "../util/typescript/object";
import iteratorMap from "../util/typescript/iterate/map";

export type Domain<
    TData extends Data,
    TAnnotation
> = [TData, TAnnotation]

/** The item types for the defined domains. */
type DomainItemTypes = {
    'Image Classification': Domain<Image, Classification>
    'Object Detection': Domain<ImageOrVideo, DetectedObjects>
    'Image Segmentation': Domain<Image, never>
    'Speech': Domain<Data, never>
}

export const DOMAIN_DATASET_METHODS = {
    'Image Classification': ICDataset,
    'Object Detection': ODDataset,
    'Image Segmentation': ISDataset,
    'Speech': SPDataset
} as const;

/** The type of the names of the defined domains. */
export type DomainName = keyof DomainItemTypes & keyof typeof DOMAIN_DATASET_METHODS;

export type DomainDataType<D extends DomainName> = DomainItemTypes[D][0]

export type DomainAnnotationType<D extends DomainName> = DomainItemTypes[D][1]

/** The names of the defined domains. */
export const DOMAIN_NAMES = [
    ...iteratorMap(
        ownPropertyIterator(DOMAIN_DATASET_METHODS),
        ([property]) => property
    )
]
