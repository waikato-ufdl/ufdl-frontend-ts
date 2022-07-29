import {MutableDatasetDispatch} from "../useDataset/DatasetDispatch";
import {Image} from "../../types/data";
import {Classification} from "../../types/annotations";

export default class ImageClassificationDatasetDispatch
    extends MutableDatasetDispatch<
        Image,
        Classification
> {
}
