import {MutableDatasetDispatch, MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";
import {DomainAnnotationType, DomainDataType} from "../../domains";

export class SpeechDatasetDispatchItem
    extends MutableDatasetDispatchItem<
        DomainDataType<'Speech'>,
        DomainAnnotationType<'Speech'>
    >
{

}

export default class SpeechDatasetDispatch
    extends MutableDatasetDispatch<
        DomainDataType<'Speech'>,
        DomainAnnotationType<'Speech'>,
        SpeechDatasetDispatchItem
> {

}