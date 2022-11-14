import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {InTransit} from "../../InTransit";
import {DatasetPK} from "../../pk";
import {ImageOrVideo} from "../../types/data";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import ObjectDetectionDatasetDispatch, {ObjectDetectionDatasetDispatchItem} from "./ObjectDetectionDatasetDispatch";
import {DetectedObjects, NO_ANNOTATION} from "../../types/annotations";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {ParallelSubTasks, subTasksAsTask, taskFromPromise} from "../../../util/typescript/task/Task";
import {forEachOwnProperty} from "../../../util/typescript/object";
import {identity} from "../../../util/identity";


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

/*
TODO: Implement when server-side support is available
function setAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: Classification | typeof NO_ANNOTATION }
) {
    const categories: Parameters<typeof ICDataset.set_categories>[2] = {}

    forEachOwnProperty(
        annotations,
        (filename, annotation) => {
            categories[filename] = annotation === NO_ANNOTATION ? [] : [annotation]
        }
    )

    return taskFromPromise(
        ICDataset.set_categories(
            context,
            dataset.pk,
            categories
        )
    )
}
 */

function setAnnotationsOneByOne(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: DetectedObjects | typeof NO_ANNOTATION }
) {
    const subTasks: ParallelSubTasks<string, void, string> = {}
    const keys: string[] = []

    forEachOwnProperty(
        annotations,
        (filename, annotation) => {
            keys.push(filename as string)
            subTasks[filename] = taskFromPromise(
                setAnnotationForFile(
                    context,
                    dataset,
                    filename as string,
                    annotation
                )
            )
        }
    )

    return subTasksAsTask(
        subTasks,
        keys,
        identity
    )
}

async function setAnnotationForFile(
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
    datasetPK?: DatasetPK,
    queryDependencies?: readonly unknown[]
): ObjectDetectionDatasetDispatch | undefined {
    return useDataset(
        serverContext,
        getData,
        setData,
        getAnnotations,
        setAnnotationsOneByOne,
        ObjectDetectionDatasetDispatchItem,
        ObjectDetectionDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
