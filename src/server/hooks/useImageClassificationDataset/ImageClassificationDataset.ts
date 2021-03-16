import {DatasetItem} from "../../DatasetItem";

export type ImageClassificationDatasetItem = DatasetItem<string>

export type ImageClassificationDataset = ReadonlyMap<string, ImageClassificationDatasetItem>
