import useDataset from "../useDataset/useDataset";
import UFDLServerContext from "ufdl-ts-client/UFDLServerContext";
import {Loading} from "../../Loading";
import {DatasetPK} from "../../pk";
import * as SCDataset from "ufdl-ts-client/functional/spectrum_classification/dataset";
import SpectrumClassificationDatasetDispatch, {SpectrumClassificationDatasetDispatchItem} from "./SpectrumClassificationDatasetDispatch";
import {NO_ANNOTATION} from "../../NO_ANNOTATION";
import {BlobSubject} from "../../../util/rx/data/BlobSubject";
import {DatasetInstance} from "ufdl-ts-client/types/core/dataset";
import {forEachOwnProperty} from "../../../util/typescript/object";
import {mapTask, ParallelSubTasks, subTasksAsTask, taskFromPromise} from "../../../util/typescript/task/Task";
import {identity} from "../../../util/identity";
import {anyToString} from "../../../util/typescript/strings/anyToString";
import {useContext} from "react";
import {APP_SETTINGS_REACT_CONTEXT} from "../../../useAppSettings";
import {Spectrum} from "../../types/data";
import {Classification} from "../../types/annotations/Classification";


async function getData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    rawData: BlobSubject
): Promise<Loading<Spectrum>> {

    return Loading.fromBehaviourSubject(rawData).map(
        value => new Spectrum(value)
    )
}

function setData(
    _context: UFDLServerContext,
    _dataset: DatasetInstance,
    _filename: string,
    _data: Spectrum
) {
    // No additional work required
}

function getAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance
) {
    return mapTask(
        taskFromPromise(
            SCDataset.get_categories(
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
    const categories = await SCDataset.get_categories_for_file(context, dataset.pk, filename);

    if (categories.length === 0)
        return NO_ANNOTATION;

    return categories[0];
}

function setAnnotationsBulk(
    context: UFDLServerContext,
    dataset: DatasetInstance,
    annotations: { [filename: string]: Classification | typeof NO_ANNOTATION }
) {
    const categories: Parameters<typeof SCDataset.set_categories>[2] = {}

    forEachOwnProperty(
        annotations,
        (filename, annotation) => {
            categories[filename] = annotation === NO_ANNOTATION ? [] : [annotation]
        }
    )

    return taskFromPromise(
        SCDataset.set_categories(
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

    await SCDataset.set_categories(
        context,
        dataset.pk,
        {
            [filename]: annotationsList
        }
    )
}

export default function useSpectrumClassificationDataset(
    serverContext: UFDLServerContext,
    datasetPK?: DatasetPK,
    queryDependencies?: {
        dataset?: readonly unknown[]
        fileData?: readonly unknown[]
        annotations?: readonly unknown[]
        onlyFetched?: boolean
    }
): SpectrumClassificationDatasetDispatch | undefined {

    const [appSettings] = useContext(APP_SETTINGS_REACT_CONTEXT);

    return useDataset(
        serverContext,
        getData,
        setData,
        appSettings.uploadBulkWherePossible ? getAnnotationsBulk : getAnnotationsOneByOne,
        setAnnotationsOneByOne,
        SpectrumClassificationDatasetDispatchItem,
        SpectrumClassificationDatasetDispatch,
        datasetPK,
        queryDependencies
    )
}
