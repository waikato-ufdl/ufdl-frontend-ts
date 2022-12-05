import {CompareFunction} from "../../../util/typescript/sort/CompareFunction";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {Classification} from "../../types/annotations/Classification";
import {localeCompareUndefined} from "../../../util/typescript/strings/localeCompareUndefined";
import {asLabel} from "../../util/classification";
import {DatasetDispatchItem} from "../../hooks/useDataset/DatasetDispatch";
import {Data} from "../../types/data";
import hasData from "../../../util/react/query/hasData";

export const BY_CLASSIFICATION: CompareFunction<DatasetDispatchItem<Data, Classification>> = (
    a,
    b
) => {
    return localeCompareUndefined(
        asLabel(hasData(a.annotations) ? a.annotations.data : NO_ANNOTATION, undefined),
        asLabel(hasData(b.annotations) ? b.annotations.data : NO_ANNOTATION, undefined)
    )
}
