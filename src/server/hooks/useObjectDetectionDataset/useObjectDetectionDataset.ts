import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {InTransit} from "../../InTransit";
import {DatasetPK} from "../../pk";
import {ImageOrVideo} from "../../types/data";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import ObjectDetectionDatasetDispatch from "./ObjectDetectionDatasetDispatch";
import {DetectedObjects, NO_ANNOTATION} from "../../types/annotations";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {MutableDatasetDispatchItem} from "../useDataset/DatasetDispatch";


async function getData(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    rawData: BlobSubject
): Promise<InTransit<ImageOrVideo>> {
    const fileType = await ODDataset.get_file_type(
        context,
        dataset.pk,
        filename
    )

    return InTransit.fromBehaviourSubject(rawData).map(
        value => {
            return new ImageOrVideo(
                value,
                fileType.format,
                fileType.dimensions,
                fileType.length
            )
        }
    )
}

async function setData(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    data: ImageOrVideo
) {
    await ODDataset.set_file_type(
        context,
        dataset.pk,
        filename,
        data.format,
        data.dimensions,
        data.videoLength
    )
}

async function getAnnotations(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string
): Promise<DetectedObjects | typeof NO_ANNOTATION> {
    const annotations = await ODDataset.get_annotations_for_file(context, dataset.pk, filename)

    if (annotations.length === 0) return NO_ANNOTATION

    return annotations as DetectedObjects;
}

async function setAnnotations(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    annotations: DetectedObjects | typeof NO_ANNOTATION
) {
    const annotationsList = annotations === NO_ANNOTATION ? [] : annotations

    await ODDataset.set_annotations_for_file(
        context,
        dataset.pk,
        filename,
        annotationsList
    )

}

export default function useObjectDetectionDataset(
    serverContext: UFDLServerContext,
    datasetPK?: DatasetPK
): ObjectDetectionDatasetDispatch | undefined {
    return useDataset(
        serverContext,
        getData,
        setData,
        getAnnotations,
        setAnnotations,
        MutableDatasetDispatchItem,
        ObjectDetectionDatasetDispatch,
        datasetPK
    )
}
