import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {Loading} from "../../Loading";
import {DatasetPK} from "../../pk";
import {ImageOrVideo} from "../../types/data";
import * as ODDataset from "ufdl-ts-client/functional/object_detection/dataset";
import ObjectDetectionDatasetDispatch, {ObjectDetectionDatasetDispatchItem} from "./ObjectDetectionDatasetDispatch";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {DetectedObjects} from "../../types/annotations/DetectedObjects";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {mapTask, ParallelSubTasks, subTasksAsTask, taskFromPromise} from "../../../util/typescript/task/Task";
import {forEachOwnProperty} from "../../../util/typescript/object";
import {identity} from "../../../util/identity";
import {anyToString} from "../../../util/typescript/strings/anyToString";
import {useContext} from "react";
import {APP_SETTINGS_REACT_CONTEXT} from "../../../useAppSettings";


async function getData(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string,
    rawData: BlobSubject
): Promise<Loading<ImageOrVideo>> {
    const fileType = await ODDataset.get_file_type(
        context,
        dataset.pk,
        filename
    )

    return Loading.fromBehaviourSubject(rawData).map(
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

function getAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance
) {
    return mapTask(
        taskFromPromise(
            ODDataset.get_annotations(
                context,
                dataset.pk
            )
        ),
        result => {
            const annotations: { [filename: string]: DetectedObjects | typeof NO_ANNOTATION | undefined } = {}
            forEachOwnProperty(
                dataset.files,
                (filename) => {
                    const detectedObjects = result[filename]?.annotations
                    if (detectedObjects === undefined) return
                    annotations[filename] = detectedObjects.length === 0
                        ? NO_ANNOTATION
                        : detectedObjects as DetectedObjects
                }
            )
            return annotations
        },
        anyToString,
        identity
    )
}

function getAnnotationsOneByOne(
    context: UFDLServerContext,
    dataset: DatasetInstance
) {

    const subTasks: ParallelSubTasks<string, DetectedObjects | typeof NO_ANNOTATION, string, never> = {}
    const keys: string[] = []

    forEachOwnProperty(
        dataset.files,
        (filename) => {
            if (filename in subTasks) return
            keys.push(filename as string)
            subTasks[filename] = taskFromPromise(
                getAnnotationsForFile(
                    context,
                    dataset,
                    filename as string
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

async function getAnnotationsForFile(
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
    queryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
): ObjectDetectionDatasetDispatch | undefined {

    const [appSettings] = useContext(APP_SETTINGS_REACT_CONTEXT);

    return useDataset(
        serverContext,
        getData,
        setData,
        appSettings.uploadBulkWherePossible ? getAnnotationsBulk : getAnnotationsOneByOne,
        setAnnotationsOneByOne,
        ObjectDetectionDatasetDispatchItem,
        ObjectDetectionDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
