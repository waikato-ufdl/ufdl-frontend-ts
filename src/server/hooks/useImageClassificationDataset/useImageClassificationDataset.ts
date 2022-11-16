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
import {mapTask, ParallelSubTasks, subTasksAsTask, taskFromPromise} from "../../../util/typescript/task/Task";
import {forEachOwnProperty} from "../../../util/typescript/object";
import {identity} from "../../../util/identity";
import {useContext} from "react";
import {APP_SETTINGS_REACT_CONTEXT} from "../../../useAppSettings";
import {anyToString} from "../../../util/typescript/strings/anyToString";


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

function setData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    _data: Image
): void {
    // No need to do any additional work for images
}

function getAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance
) {
    return mapTask(
        taskFromPromise(
            ICDataset.get_categories(
                context,
                dataset.pk
            )
        ),
        result => {
            const annotations: { [filename: string]: Classification | typeof NO_ANNOTATION | undefined } = {}
            forEachOwnProperty(
                dataset.files,
                (filename) => {
                    const categories = result[filename]
                    if (categories === undefined) return
                    annotations[filename] = categories.length === 0
                        ? NO_ANNOTATION
                        : categories[0]
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

    const subTasks: ParallelSubTasks<string, Classification | typeof NO_ANNOTATION, string, never> = {}
    const keys: string[] = []

    forEachOwnProperty(
        dataset.files,
        (filename) => {
            if (filename in subTasks) return
            keys.push(filename as string)
            subTasks[filename] = taskFromPromise(
                getAnnotationForFile(
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

async function getAnnotationForFile(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    filename: string
): Promise<Classification | typeof NO_ANNOTATION> {
    const categories = await ICDataset.get_categories_for_file(context, dataset.pk, filename);

    if (categories.length === 0)
        return NO_ANNOTATION;

    return categories[0];
}

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

function setAnnotationsOneByOne(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: Classification | typeof NO_ANNOTATION }
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

    const [appSettings] = useContext(APP_SETTINGS_REACT_CONTEXT);

    return useDataset<Image, Classification, MutableDatasetDispatchItem<Image, Classification>, ImageClassificationDatasetDispatch>(
        serverContext,
        getData,
        setData,
        appSettings.uploadBulkWherePossible ? getAnnotationsBulk : getAnnotationsOneByOne,
        appSettings.uploadBulkWherePossible ? setAnnotationsBulk : setAnnotationsOneByOne,
        MutableDatasetDispatchItem,
        ImageClassificationDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
