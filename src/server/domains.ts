import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import * as ISDataset from "ufdl-ts-client/functional/image_segmentation/dataset";
import * as SPDataset from "ufdl-ts-client/functional/speech/dataset";
import {Image} from "./types/data";
import {Classification, DetectedObjects} from "./types/annotations";
import {ownPropertyIterator} from "../util/typescript/object";
import iteratorMap from "../util/typescript/iterate/map";

export const DOMAIN_DATASET_METHODS = {
    ic: ICDataset,
    od: ODDataset,
    is: ISDataset,
    sp: SPDataset
} as const;

type DomainDataAndAnnotationTypes = {
    ic: [Image, Classification]
    od: [Image, DetectedObjects]
    is: [Image, never]
    sp: [string, never]
}

export type Domain = keyof typeof DOMAIN_DATASET_METHODS & keyof DomainDataAndAnnotationTypes;

export type DomainDataType<D extends Domain> = DomainDataAndAnnotationTypes[D][0]

export type DomainAnnotationType<D extends Domain> = DomainDataAndAnnotationTypes[D][1]

export const DOMAIN_NAMES: {[key in Domain]: string} = {
    ic: "Image Classification",
    od: "Image Object Detection",
    is: "Image Segmentation",
    sp: "Speech"
};

export const DOMAINS = [
    ...iteratorMap(
        ownPropertyIterator(DOMAIN_DATASET_METHODS),
        ([property]) => property
    )
]
