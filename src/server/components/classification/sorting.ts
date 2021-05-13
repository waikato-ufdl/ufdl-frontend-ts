import {CompareFunction} from "../../../util/typescript/sort/CompareFunction";
import {DatasetItem} from "../../types/DatasetItem";
import {Classification, NO_CLASSIFICATION} from "../../types/annotations";
import {localeCompareUndefined} from "../../../util/typescript/strings/localeCompareUndefined";
import {asLabel} from "../../util/classification";

export const BY_CLASSIFICATION: CompareFunction<DatasetItem<any, Classification>> = (
    a,
    b
) => {
    return localeCompareUndefined(
        asLabel(a.annotations.success ? a.annotations.value : NO_CLASSIFICATION, undefined),
        asLabel(b.annotations.success ? b.annotations.value : NO_CLASSIFICATION, undefined)
    )
}
