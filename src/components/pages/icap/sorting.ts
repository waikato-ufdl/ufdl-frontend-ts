import {ImageClassificationDatasetItem} from "../../../server/hooks/useImageClassificationDataset/ImageClassificationDataset";
import {ElementType} from "../../../util/typescript/types/array/ElementType";
import {localeCompareUndefined} from "../../../util/typescript/strings/localeCompareUndefined";

export type SortItem = [string, ImageClassificationDatasetItem]

export type SortFunction = (
    a: SortItem,
    b: SortItem
) => number

export const SORT_ORDERS = [
    "filename",
    "label"
] as const;

export type SortOrder = ElementType<typeof SORT_ORDERS>

export const SORT_FUNCTIONS: {[key in SortOrder]: SortFunction} = {
    filename: (a, b) => a[0].localeCompare(b[0]),
    label: (a, b) => localeCompareUndefined(a[1].annotations, b[1].annotations)
};
