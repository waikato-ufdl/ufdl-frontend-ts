import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import * as ISDataset from "ufdl-ts-client/functional/image_segmentation/dataset";
import * as SPDataset from "ufdl-ts-client/functional/speech/dataset";

export const DOMAIN_DATASET_METHODS = {
    ic: ICDataset,
    od: ODDataset,
    is: ISDataset,
    sp: SPDataset
} as const;

export type AvailableDomainsType = keyof typeof DOMAIN_DATASET_METHODS;

export const DOMAIN_NAMES: {[key in AvailableDomainsType]: string} = {
    ic: "Image Classification",
    od: "Image Object Detection",
    is: "Image Segmentation",
    sp: "Speech"
};
