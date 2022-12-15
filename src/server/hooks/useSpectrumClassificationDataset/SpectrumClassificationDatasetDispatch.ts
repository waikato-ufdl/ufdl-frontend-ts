import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";
import {DomainAnnotationType, DomainDataType} from "../../domains";

export class SpectrumClassificationDatasetDispatchItem
    extends MutableDatasetDispatchItem<
        DomainDataType<'Spectrum Classification'>,
        DomainAnnotationType<'Spectrum Classification'>
    >
{

}

export default class SpectrumClassificationDatasetDispatch
    extends MutableDatasetDispatch<
        DomainDataType<'Spectrum Classification'>,
        DomainAnnotationType<'Spectrum Classification'>,
        SpectrumClassificationDatasetDispatchItem
> {

}