import {TupleAsUnion} from "../util/typescript/types/tuple";

export const AVAILABLE_DOMAINS = ["ic", "od", "is", "sp"] as const;

export type AvailableDomainsType = TupleAsUnion<typeof AVAILABLE_DOMAINS>;

export const DOMAIN_NAMES: {[key in AvailableDomainsType]: string} = {
    ic: "Image Classification",
    od: "Image Object Detection",
    is: "Image Segmentation",
    sp: "Speech"
};
