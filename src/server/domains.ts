import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import * as ISDataset from "ufdl-ts-client/functional/image_segmentation/dataset";
import * as SPDataset from "ufdl-ts-client/functional/speech/dataset";
import {Image} from "./types/data";
import {Classification, DetectedObjects} from "./types/annotations";
import {ownPropertyIterator} from "../util/typescript/object";
import iteratorMap from "../util/typescript/iterate/map";

export const DOMAIN_DATASET_METHODS = {
    'Image Classification': ICDataset,
    'Object Detection': ODDataset,
    'Image Segmentation': ISDataset,
    'Speech': SPDataset
} as const;

type DomainDataAndAnnotationTypes = {
    'Image Classification': [Image, Classification]
    'Object Detection': [Image, DetectedObjects]
    'Image Segmentation': [Image, never]
    'Speech': [string, never]
}

export type Domain = keyof typeof DOMAIN_DATASET_METHODS & keyof DomainDataAndAnnotationTypes;

export type DomainDataType<D extends Domain> = DomainDataAndAnnotationTypes[D][0]

export type DomainAnnotationType<D extends Domain> = DomainDataAndAnnotationTypes[D][1]

export const DOMAINS = [
    ...iteratorMap(
        ownPropertyIterator(DOMAIN_DATASET_METHODS),
        ([property]) => property
    )
]
