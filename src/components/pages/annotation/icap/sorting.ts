import {ElementType} from "../../../../util/typescript/types/array/ElementType";
import {localeCompareUndefined} from "../../../../util/typescript/strings/localeCompareUndefined";
import {DatasetItem} from "../../../../server/types/DatasetItem";
import {Image} from "../../../../server/types/data";
import {Classification, NO_CLASSIFICATION} from "../../../../server/types/annotations";
import {asLabel} from "../../../../server/util/classification";

export type SortFunction = (
    a: DatasetItem<Image, Classification>,
    b: DatasetItem<Image, Classification>
) => number

export const SORT_ORDERS = [
    "filename",
    "label"
] as const;

export type SortOrder = ElementType<typeof SORT_ORDERS>

export const SORT_FUNCTIONS: {[key in SortOrder]: SortFunction} = {
    filename: (a, b) => a.filename.localeCompare(b.filename),
    label: (a, b) => localeCompareUndefined(
        asLabel(a.annotations.success ? a.annotations.value : NO_CLASSIFICATION, undefined),
        asLabel(b.annotations.success ? b.annotations.value : NO_CLASSIFICATION, undefined)
    )
};
