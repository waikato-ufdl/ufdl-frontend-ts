import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {DatasetPK} from "../../pk";
import {Classification, NO_ANNOTATION} from "../../types/annotations";
import * as ICDataset from "ufdl-ts-client/functional/image_classification/dataset";
import ImageClassificationDatasetDispatch from "./ImageClassificationDatasetDispatch";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {Image} from "../../types/data";
import {InTransit} from "../../InTransit";
import {MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";


function getData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    rawData: BlobSubject
): InTransit<Image> {
    return InTransit.fromBehaviourSubject(rawData).map(
        value => {
            return new Image(
                value,
                undefined,
                undefined
            )
        }
    )
}

async function setData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    _data: Image
) {
    // No need to do any additional work for images
}

async function getAnnotations(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string
): Promise<Classification | typeof NO_ANNOTATION> {
    const categories = await ICDataset.get_categories_for_file(context, dataset.pk, filename);

    if (categories.length === 0)
        return NO_ANNOTATION;

    return categories[0];
}

async function setAnnotations(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    annotations: Classification | typeof NO_ANNOTATION
) {
    const annotationsList = annotations === NO_ANNOTATION ? [] : [annotations]

    await ICDataset.set_categories(
        context,
        dataset.pk,
        {
            [filename]: annotationsList
        }
    )
}

export default function useImageClassificationDataset(
    serverContext: UFDLServerContext,
    datasetPK?: DatasetPK,
    queryDependencies?: readonly unknown[]
): ImageClassificationDatasetDispatch | undefined {
    return useDataset<Image, Classification, MutableDatasetDispatchItem<Image, Classification>, ImageClassificationDatasetDispatch>(
        serverContext,
        getData,
        setData,
        getAnnotations,
        setAnnotations,
        MutableDatasetDispatchItem,
        ImageClassificationDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
